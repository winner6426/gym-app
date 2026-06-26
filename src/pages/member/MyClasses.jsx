import { CalendarDays, Clock3, LoaderCircle, MapPin, Search, Trash2, UsersRound, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { getMyCards, requestClassCancellation } from "../../services/memberService.js"

const statusOptions = [
  { value: "ALL", label: "Tất cả lớp" },
  { value: "ACTIVE", label: "Đang học" },
  { value: "FROZEN", label: "Đang bảo lưu" },
  { value: "CANCELLATION_REQUESTED", label: "Chờ hủy lớp" },
  { value: "FINISHED", label: "Hết buổi" },
]

const statusLabels = {
  ACTIVE: "Đang học",
  FROZEN: "Đang bảo lưu",
  CANCELLATION_REQUESTED: "Chờ hủy lớp",
  FINISHED: "Hết buổi",
  CANCELLED: "Đã hủy",
}

const statusStyles = {
  ACTIVE: "bg-emerald-500/10 text-emerald-300",
  FROZEN: "bg-blue-500/10 text-blue-300",
  CANCELLATION_REQUESTED: "bg-amber-500/10 text-amber-200",
  FINISHED: "bg-zinc-500/15 text-zinc-300",
  CANCELLED: "bg-zinc-500/15 text-zinc-300",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function getDisplayStatus(card) {
  if (card.registrationStatus === "CANCELLATION_REQUESTED") return "CANCELLATION_REQUESTED"
  if (card.registrationStatus === "CANCELLED" || card.status === "CANCELLED") return "CANCELLED"
  if (Number(card.remainingSession || 0) <= 0) return "FINISHED"
  return card.status || "ACTIVE"
}

function getRefundPercent(item) {
  if (item.refundPercent !== undefined && item.refundPercent !== null) {
    return Number(item.refundPercent)
  }

  const totalSession = Number(item.session || 0)
  const remainingSession = Number(item.remainingSession || 0)
  const usedSession = Math.max(totalSession - remainingSession, 0)

  if (totalSession === 0 || remainingSession === totalSession) return 100
  if (usedSession * 2 <= totalSession) return 50
  return 0
}

function getRefundAmount(item) {
  if (item.refundAmount !== undefined && item.refundAmount !== null) {
    return Number(item.refundAmount)
  }

  return Number(item.paidAmount || 0) * getRefundPercent(item) / 100
}

function formatDate(value) {
  if (!value) return "Chưa có"
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`))
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function CancellationDialog({ card, saving, error, onClose, onConfirm }) {
  const refundPercent = getRefundPercent(card)
  const refundAmount = getRefundAmount(card)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-xl rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Yêu cầu hủy lớp</p>
            <h2 className="mt-1 text-xl font-bold">{card.classroomName}</h2>
          </div>
          <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-secondary" onClick={onClose} aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          <div className="rounded-md border border-border bg-secondary p-4">
            <p className="font-semibold">Quy định hoàn tiền</p>
            <p className="mt-2 text-muted-foreground">Còn nguyên số buổi tập: hoàn 100% số tiền đã đóng cho lớp này.</p>
            <p className="mt-1 text-muted-foreground">Đã dùng ít hơn hoặc bằng 50% số buổi: hoàn 50% số tiền đã đóng.</p>
            <p className="mt-1 text-muted-foreground">Đã dùng quá 50% số buổi: không hoàn tiền.</p>
          </div>

          <div className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Còn lại</p><p className="mt-1 font-semibold">{card.remainingSession}/{card.session} buổi</p></div>
            <div><p className="text-xs text-muted-foreground">Mức hoàn</p><p className="mt-1 font-semibold">{refundPercent}%</p></div>
            <div><p className="text-xs text-muted-foreground">Dự kiến hoàn</p><p className="mt-1 font-semibold text-primary">{formatCurrency(refundAmount)}</p></div>
          </div>

          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100">
            Sau khi gửi yêu cầu, nhân viên sẽ gọi điện xác nhận và xử lý hoàn tiền theo quy định.
          </p>

          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Đóng</Button>
            <Button type="button" onClick={onConfirm} disabled={saving}>
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              Xác nhận gửi yêu cầu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyClasses() {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancellationCard, setCancellationCard] = useState(null)
  const [cancellationError, setCancellationError] = useState("")
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError("")
      try {
        setCards(await getMyCards(user.id))
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user.id])

  const filteredCards = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    return cards.filter((card) => {
      const displayStatus = getDisplayStatus(card)
      const matchesStatus = statusFilter === "ALL" || displayStatus === statusFilter
      const matchesKeyword = !keyword || [
        card.classroomCode,
        card.classroomName,
        card.courseName,
        card.trainerName,
        card.centerName,
        card.province,
      ]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("vi").includes(keyword))

      return matchesStatus && matchesKeyword
    })
  }, [cards, search, statusFilter])

  const handleRequestCancellation = async () => {
    if (!cancellationCard) return

    setCancelling(true)
    setCancellationError("")
    try {
      const updated = await requestClassCancellation(cancellationCard.id, user.id)
      setCards((current) =>
        current.map((card) => card.id === cancellationCard.id
          ? {
              ...card,
              registrationStatus: updated.status,
              paidAmount: updated.paidAmount ?? card.paidAmount,
              refundPercent: updated.refundPercent ?? card.refundPercent,
              refundAmount: updated.refundAmount ?? card.refundAmount,
              refundPolicyMessage: updated.refundPolicyMessage ?? card.refundPolicyMessage,
            }
          : card),
      )
      setCancellationCard(null)
    } catch (requestError) {
      setCancellationError(getErrorMessage(requestError))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="mt-2 text-3xl font-bold">Lớp của tôi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi các lớp đã đăng ký, lịch tập và số buổi còn lại.
          </p>
        </div>
        <Link to="/member/course-registration">
          <Button>Đăng ký lớp mới</Button>
        </Link>
      </div>

      {error && (
        <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          Đang tải lớp đã đăng ký...
        </div>
      ) : (
        <>
          <Card className="mt-5">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="my-classes-search"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm mã lớp, tên lớp, khóa học, HLV..."
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <p className="whitespace-nowrap text-sm text-muted-foreground">
                {filteredCards.length} / {cards.length} lớp
              </p>
            </div>
          </Card>

          {cards.length === 0 ? (
            <Card className="mt-6 flex min-h-48 items-center justify-center text-sm text-muted-foreground">
              Bạn chưa có lớp nào đã được cấp thẻ.
            </Card>
          ) : filteredCards.length === 0 ? (
            <Card className="mt-6 flex min-h-48 items-center justify-center text-sm text-muted-foreground">
              Không tìm thấy lớp phù hợp với bộ lọc.
            </Card>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredCards.map((card) => {
                const displayStatus = getDisplayStatus(card)
                return (
                  <Card key={card.id} className="p-6">
                    <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row">
                      <div>
                        <p className="text-xs font-semibold text-primary">
                          {card.classroomCode} - {card.level}
                        </p>
                        <h2 className="mt-2 text-xl font-bold">{card.classroomName}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {card.courseName} - HLV {card.trainerName}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-fit rounded-md px-3 py-1.5 text-xs font-semibold ${statusStyles[displayStatus] || "bg-secondary text-muted-foreground"}`}>
                          {statusLabels[displayStatus] || displayStatus}
                        </span>
                        {["ACTIVE", "FROZEN"].includes(displayStatus) && (
                          <Button variant="outline" onClick={() => { setCancellationError(""); setCancellationCard(card) }}>
                            <Trash2 className="h-4 w-4" />Hủy lớp
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Cấp ngày {formatDate(card.issuedDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Còn {card.remainingSession}/{card.session} buổi
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {card.centerName} - {card.province}
                      </p>
                      <p className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-primary" />
                        Thẻ #{card.id}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {cancellationCard && (
        <CancellationDialog
          card={cancellationCard}
          saving={cancelling}
          error={cancellationError}
          onClose={() => setCancellationCard(null)}
          onConfirm={handleRequestCancellation}
        />
      )}
    </>
  )
}
