import { ArrowRightLeft, CalendarDays, Clock3, LoaderCircle, MapPin, Search, Trash2, UsersRound, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import {
  getMyCards,
  getTravelClassrooms,
  requestClassCancellation,
  transferClassroom,
} from "../../services/memberService.js"

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

function getUsedSession(item) {
  return Math.max(Number(item.session || 0) - Number(item.remainingSession || 0), 0)
}

function getRefundPercent(item) {
  if (item.refundPercent !== undefined && item.refundPercent !== null) return Number(item.refundPercent)
  const totalSession = Number(item.session || 0)
  const usedSession = getUsedSession(item)
  if (totalSession === 0 || usedSession === 0) return 100
  if (usedSession * 2 <= totalSession) return 50
  return 0
}

function getRefundAmount(item) {
  if (item.refundAmount !== undefined && item.refundAmount !== null) return Number(item.refundAmount)
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

function ModalShell({ title, eyebrow, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-bold">{title}</h2>
          </div>
          <button type="button" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function CancellationDialog({ card, saving, error, onClose, onConfirm }) {
  const refundPercent = getRefundPercent(card)
  const refundAmount = getRefundAmount(card)

  return (
    <ModalShell title={card.classroomName} eyebrow="Yêu cầu hủy lớp" onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="rounded-md border border-border p-4">
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

        <p className="rounded-md border px-4 py-3 text-amber-100">
          Sau khi gửi yêu cầu, nhân viên sẽ gọi điện xác nhận và xử lý hoàn tiền theo quy định.
        </p>

        {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</p>}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Đóng</Button>
          <Button type="button" onClick={onConfirm} disabled={saving}>
            {saving ? "Đang gửi..." : "Xác nhận gửi yêu cầu"}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function TransferDialog({
  card,
  options,
  loading,
  saving,
  error,
  selectedClassroomId,
  provinceFilter,
  onProvinceChange,
  onSelectClassroom,
  onClose,
  onConfirm,
}) {
  const provinces = [...new Set(options.map((item) => item.province).filter(Boolean))]
  const filteredOptions = options.filter((item) => provinceFilter === "ALL" || item.province === provinceFilter)
  const selectedClassroom = options.find((item) => String(item.id) === String(selectedClassroomId))
  const usedSession = getUsedSession(card)

  return (
    <ModalShell title={card.classroomName} eyebrow="Chuyển lớp" onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="grid gap-3 rounded-md border border-border bg-secondary p-4 sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Khóa học</p><p className="mt-1 font-semibold">{card.courseName}</p></div>
          <div><p className="text-xs text-muted-foreground">Đã học</p><p className="mt-1 font-semibold">{usedSession}/{card.session} buổi</p></div>
          <div><p className="text-xs text-muted-foreground">Lớp mới bắt đầu từ</p><p className="mt-1 font-semibold">Buổi {usedSession + 1}</p></div>
        </div>

        <p className="rounded-md border px-4 py-3 text-amber-100">
          Sau khi chuyển lớp, bạn chỉ được học và điểm danh ở lớp mới từ buổi thứ {usedSession + 1} trong lịch tập của lớp đó.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">Chọn lớp cùng khóa học</p>
          <select value={provinceFilter} onChange={(event) => onProvinceChange(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none">
            <option value="ALL">Tất cả tỉnh/thành phố</option>
            {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center text-muted-foreground">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải lớp có thể chuyển...
          </div>
        ) : filteredOptions.length === 0 ? (
          <Card className="flex min-h-40 items-center justify-center text-center text-muted-foreground">
            Không có lớp cùng khóa học phù hợp để chuyển.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredOptions.map((classroom) => (
              <button
                key={classroom.id}
                type="button"
                onClick={() => onSelectClassroom(String(classroom.id))}
                className={`rounded-md border bg-card p-4 text-left transition-colors ${
                  String(classroom.id) === String(selectedClassroomId)
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-semibold">{classroom.code} - {classroom.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{classroom.centerName} - {classroom.province}</p>
                <p className="mt-2 text-xs text-primary">Còn {classroom.maxCapacity - classroom.currentCapacity} chỗ</p>
              </button>
            ))}
          </div>
        )}

        {selectedClassroom && (
          <div className="rounded-md border border-border p-4">
            <p className="font-semibold">Lớp đã chọn</p>
            <p className="mt-1 text-muted-foreground">{selectedClassroom.code} - {selectedClassroom.name}</p>
            <p className="mt-1 text-muted-foreground">{selectedClassroom.centerName} - {selectedClassroom.province}</p>
          </div>
        )}

        {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</p>}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Đóng</Button>
          <Button type="button" onClick={onConfirm} disabled={saving || !selectedClassroomId}>
            {saving ? "Đang chuyển..." : "Xác nhận chuyển lớp"}
          </Button>
        </div>
      </div>
    </ModalShell>
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
  const [transferCard, setTransferCard] = useState(null)
  const [transferOptions, setTransferOptions] = useState([])
  const [transferProvince, setTransferProvince] = useState("ALL")
  const [selectedTransferClassroomId, setSelectedTransferClassroomId] = useState("")
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferSaving, setTransferSaving] = useState(false)
  const [transferError, setTransferError] = useState("")

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
      ].filter(Boolean).some((value) => value.toLocaleLowerCase("vi").includes(keyword))

      return matchesStatus && matchesKeyword
    })
  }, [cards, search, statusFilter])

  const handleOpenTransfer = async (card) => {
    setTransferCard(card)
    setTransferOptions([])
    setTransferProvince("ALL")
    setSelectedTransferClassroomId("")
    setTransferError("")
    setTransferLoading(true)
    try {
      setTransferOptions(await getTravelClassrooms({ userId: user.id, cardId: card.id }))
    } catch (requestError) {
      setTransferError(getErrorMessage(requestError))
    } finally {
      setTransferLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!transferCard || !selectedTransferClassroomId) return

    setTransferSaving(true)
    setTransferError("")
    try {
      const updated = await transferClassroom({
        userId: user.id,
        cardId: transferCard.id,
        targetClassroomId: Number(selectedTransferClassroomId),
      })
      setCards((current) =>
        current.map((card) => card.id === transferCard.id
          ? { ...card, ...updated }
          : card),
      )
      setTransferCard(null)
    } catch (requestError) {
      setTransferError(getErrorMessage(requestError))
    } finally {
      setTransferSaving(false)
    }
  }

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

      {error && <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

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
                <Input id="my-classes-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã lớp, tên lớp, khóa học, HLV..." />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none">
                {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
              <p className="whitespace-nowrap text-sm text-muted-foreground">{filteredCards.length} / {cards.length} lớp</p>
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
                        <p className="text-xs font-semibold text-primary">{card.classroomCode} - {card.level}</p>
                        <h2 className="mt-2 text-xl font-bold">{card.classroomName}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{card.courseName} - HLV {card.trainerName}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-fit rounded-md px-3 py-1.5 text-xs font-semibold ${statusStyles[displayStatus] || "bg-secondary text-muted-foreground"}`}>
                          {statusLabels[displayStatus] || displayStatus}
                        </span>
                        {displayStatus === "ACTIVE" && (
                          <Button variant="outline" onClick={() => handleOpenTransfer(card)}>
                            Chuyển lớp
                          </Button>
                        )}
                        {["ACTIVE", "FROZEN"].includes(displayStatus) && (
                          <Button variant="outline" onClick={() => { setCancellationError(""); setCancellationCard(card) }}>
                            Hủy lớp
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                      <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Cấp ngày {formatDate(card.issuedDate)}</p>
                      <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />Còn {card.remainingSession}/{card.session} buổi</p>
                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{card.centerName} - {card.province}</p>
                      <p className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-primary" />Thẻ #{card.id}</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {transferCard && (
        <TransferDialog
          card={transferCard}
          options={transferOptions}
          loading={transferLoading}
          saving={transferSaving}
          error={transferError}
          selectedClassroomId={selectedTransferClassroomId}
          provinceFilter={transferProvince}
          onProvinceChange={setTransferProvince}
          onSelectClassroom={setSelectedTransferClassroomId}
          onClose={() => setTransferCard(null)}
          onConfirm={handleTransfer}
        />
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
