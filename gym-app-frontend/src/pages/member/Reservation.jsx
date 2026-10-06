import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, LoaderCircle, PauseCircle } from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { createFreezeRequest, getMyCards, getMyFreezeRequests } from "../../services/memberService.js"

const levelLabels = { BASIC: "Cơ bản", ADVANCED: "Nâng cao", PROFESSIONAL: "Chuyên nghiệp" }
const statusLabels = { PENDING: "Chờ nhân viên duyệt", FROZEN: "Đang bảo lưu", REJECTED: "Từ chối", RESUMED: "Đã học lại", CANCELLED: "Đã hủy" }

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`)) : "Chưa có"
}

function addMonthsDate(months) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

export default function Reservation() {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [freezeRequests, setFreezeRequests] = useState([])
  const [selectedCardId, setSelectedCardId] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(addMonthsDate(3))
  const [reason, setReason] = useState("Công việc / đi công tác dài hạn")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [cardData, freezeData] = await Promise.all([
        getMyCards(user.id),
        getMyFreezeRequests(user.id),
      ])
      setCards(cardData)
      setFreezeRequests(freezeData)
      const activeCard = cardData.find((card) => card.status === "ACTIVE" && Number(card.remainingSession) > 0)
      if (activeCard) setSelectedCardId(String(activeCard.id))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [user.id])

  const activeCards = useMemo(
    () => cards.filter((card) => card.status === "ACTIVE" && Number(card.remainingSession) > 0),
    [cards],
  )
  const selectedCard = activeCards.find((card) => String(card.id) === String(selectedCardId))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!selectedCardId) {
      setError("Vui lòng chọn khóa học cần bảo lưu.")
      return
    }
    if (!startDate || !endDate || startDate > endDate) {
      setError("Ngày bắt đầu và ngày dự kiến quay lại chưa hợp lệ.")
      return
    }
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do bảo lưu.")
      return
    }

    setSaving(true)
    try {
      const created = await createFreezeRequest({
        userId: Number(user.id),
        cardId: Number(selectedCardId),
        startDate,
        endDate,
        reason: [reason, note.trim()].filter(Boolean).join(" - "),
      })
      setFreezeRequests((current) => [created, ...current])
      setSuccess(`Đã gửi yêu cầu bảo lưu BL-${created.id}. Nhân viên trung tâm sẽ duyệt trước khi khóa chuyển sang bảo lưu.`)
      setSelectedCardId("")
      setNote("")
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-7">
       
        <h1 className="mt-2 text-3xl font-bold">Xin bảo lưu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thời gian bảo lưu tối đa 12 tháng.
        </p>
      </div>

      {error && <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {success && <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-5 w-5" />{success}</p>}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải dữ liệu bảo lưu...
        </div>
      ) : (
        <>
          <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
            <Card className="grid gap-5 p-6 sm:grid-cols-2">
              <label className="sm:col-span-2" htmlFor="freeze-card">
                <span className="mb-2 block text-sm font-semibold">Khóa học hiện tại</span>
                <select id="freeze-card" value={selectedCardId} onChange={(event) => setSelectedCardId(event.target.value)} className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none">
                  <option value="">Chọn khóa cần bảo lưu</option>
                  {activeCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.classroomCode} - {card.classroomName} - còn {card.remainingSession} buổi
                    </option>
                  ))}
                </select>
              </label>
              <Input label="Số buổi còn lại" value={selectedCard ? `${selectedCard.remainingSession}/${selectedCard.session} buổi` : ""} readOnly />
              <Input label="Trình độ" value={selectedCard ? levelLabels[selectedCard.level] || selectedCard.level : ""} readOnly />
              <Input label="Ngày bắt đầu" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <Input label="Ngày dự kiến quay lại" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              <label className="sm:col-span-2" htmlFor="freeze-reason">
                <span className="mb-2 block text-sm font-semibold">Lý do bảo lưu</span>
                <select id="freeze-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option>Công việc / đi công tác dài hạn</option>
                  <option>Sức khỏe</option>
                  <option>Gia đình</option>
                  <option>Lý do cá nhân</option>
                </select>
              </label>
              <label className="sm:col-span-2" htmlFor="freeze-note">
                <span className="mb-2 block text-sm font-semibold">Mô tả thêm</span>
                <textarea id="freeze-note" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-28 w-full rounded-md border border-border bg-background p-3 text-sm outline-none" />
              </label>
            </Card>
            <Card className="h-fit">
              
              <h2 className="mt-4 font-bold">Điều kiện bảo lưu</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>Không có công nợ học phí.</li>
                <li>Khi học lại, lớp phụ thuộc lịch tuyển sinh và sĩ số.</li>
              </ul>
              <Button className="mt-6 w-full" disabled={saving || !selectedCardId}>
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Gửi yêu cầu
              </Button>
            </Card>
          </form>

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-bold">Lịch sử bảo lưu</h2>
            {freezeRequests.length === 0 ? (
              <Card className="text-sm text-muted-foreground">Bạn chưa có yêu cầu bảo lưu nào.</Card>
            ) : (
              <div className="space-y-3">
                {freezeRequests.map((item) => (
                  <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">BL-{item.id} - {item.classroomName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(item.startDate)} đến {formatDate(item.endDate)} - còn {item.remainingSession} buổi
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                    <span className="h-fit rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                      {statusLabels[item.status] || item.status}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}

