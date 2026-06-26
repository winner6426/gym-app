import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Send,
  UserRound,
  UsersRound,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import {
  createMakeupRequest,
  getAvailableClassroomsForMakeup,
  getMyCards,
  getMyMakeupRequests,
} from "../../services/memberService.js"

const levelLabels = {
  BASIC: "Cơ bản",
  ADVANCED: "Nâng cao",
  PROFESSIONAL: "Chuyên nghiệp",
}

const statusLabels = {
  PENDING: "Chờ xét duyệt",
  APPROVED: "Đã chấp nhận",
  REJECTED: "Bị từ chối",
}

const statusStyles = {
  PENDING: "bg-amber-500/10 text-amber-200",
  APPROVED: "bg-emerald-500/10 text-emerald-200",
  REJECTED: "bg-red-500/10 text-red-200",
}

const dayLabels = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
}

function formatDate(value) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value + "T00:00:00"))
}

function formatDateTime(value) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function formatSchedule(scheduleStr) {
  // scheduleStr dạng "MONDAY 08:00-10:00"
  const parts = scheduleStr.split(" ")
  if (parts.length < 2) return scheduleStr
  const day = dayLabels[parts[0]] || parts[0]
  return `${day} ${parts[1]}`
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

export default function MakeupClass() {
  const { user } = useAuth()

  // Data
  const [activeCards, setActiveCards] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [myRequests, setMyRequests] = useState([])

  // Form state
  const [selectedCardId, setSelectedCardId] = useState("")
  const [selectedClassroomId, setSelectedClassroomId] = useState("")
  const [absenceDate, setAbsenceDate] = useState("")
  const [reason, setReason] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("ALL")

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [cardsData, classroomsData, requestsData] = await Promise.all([
        getMyCards(user.id),
        getAvailableClassroomsForMakeup(user.id),
        getMyMakeupRequests(user.id),
      ])
      const cards = cardsData.filter((c) => c.status === "ACTIVE")
      setActiveCards(cards)
      setClassrooms(classroomsData)
      setMyRequests(requestsData)
      if (cards.length > 0 && !selectedCardId) {
        setSelectedCardId(String(cards[0].id))
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user.id])

  // Tính tháng hiện tại đã xin bù chưa
  const currentMonthRequests = myRequests.filter((req) => {
    if (!req.absenceDate) return false
    const d = new Date(req.absenceDate + "T00:00:00")
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const hasUsedMakeupThisMonth = currentMonthRequests.length >= 1

  const selectedCard = activeCards.find((card) => String(card.id) === String(selectedCardId))
  const provinces = [...new Set(classrooms.map((cl) => cl.province).filter(Boolean))]
  const filteredClassrooms = useMemo(() => (
    classrooms.filter((cl) => {
      const sameCourse = selectedCard?.courseId
        ? Number(cl.courseId) === Number(selectedCard.courseId)
        : cl.courseName === selectedCard?.courseName
      const sameProvince = provinceFilter === "ALL" || cl.province === provinceFilter
      return sameCourse && sameProvince
    })
  ), [classrooms, provinceFilter, selectedCard])
  const selectedClassroomIsAvailable = filteredClassrooms.some(
    (classroom) => String(classroom.id) === String(selectedClassroomId),
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!selectedCardId) {
      setError("Vui lòng chọn thẻ học viên.")
      return
    }
    if (!selectedClassroomId) {
      setError("Vui lòng chọn lớp muốn tập bù.")
      return
    }
    if (!absenceDate) {
      setError("Vui lòng chọn ngày vắng mặt.")
      return
    }


    setSubmitting(true)
    try {
      const created = await createMakeupRequest({
        userId: Number(user.id),
        cardId: Number(selectedCardId),
        targetClassroomId: Number(selectedClassroomId),
        absenceDate,
        reason: reason.trim(),
      })
      setMyRequests((current) => [created, ...current])
      setSuccess(
        `Đã gửi yêu cầu học bù thành công.`,
      )
      setSelectedClassroomId("")
      setAbsenceDate("")
      setReason("")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const today = (() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  })()

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        Đang tải...
      </div>
    )
  }

  return (
    <>
      <div className="mb-7">
     
        <h1 className="mt-2 text-3xl font-bold">Xin học bù</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vì lý do bất khả kháng, học viên được báo vắng và xin học bù tối đa 1 buổi mỗi tháng.
        </p>
      </div>

      {/* Thống kê tháng */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Lượt bù tháng này</p>
          <p className="mt-3 text-2xl font-bold">
            {currentMonthRequests.length} / 1
          </p>
          
        </Card>
        
      </div>

      {/* Cảnh báo đã hết lượt */}
      {hasUsedMakeupThisMonth && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30  px-4 py-3 text-sm text-amber-200">
          
          <span>
            Bạn đã sử dụng lượt xin bù trong tháng này. Lượt tiếp theo sẽ được làm mới vào đầu tháng sau.
          </span>
        </div>
      )}

      {activeCards.length === 0 ? (
        <Card className="flex min-h-48 flex-col items-center justify-center text-center text-muted-foreground">
          <p className="text-sm">Bạn không có thẻ học nào đang hoạt động.</p>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          {/* Danh sách lớp bù */}
          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold">Chọn lớp tập bù</h2>
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none"
              >
                <option value="ALL">Tất cả tỉnh/thành phố</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {filteredClassrooms.length === 0 ? (
              <Card className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
                {classrooms.length === 0
                  ? "Hiện không có lớp nào phù hợp với khóa học của bạn."
                  : "Không có lớp nào ở tỉnh/thành phố đã chọn."}
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredClassrooms.map((classroom) => (
                  <button
                    key={classroom.id}
                    type="button"
                    onClick={() => setSelectedClassroomId(String(classroom.id))}
                    className={`rounded-lg border bg-card p-5 text-left transition-colors ${
                      String(classroom.id) === String(selectedClassroomId)
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-primary">
                          {levelLabels[classroom.level] || classroom.level}
                        </p>
                        <h3 className="mt-2 font-bold">{classroom.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {classroom.code} • {classroom.courseName}
                        </p>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                        {classroom.maxCapacity - classroom.currentCapacity} chỗ
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p className="flex gap-2">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        HLV {classroom.trainerName}
                      </p>
                      {classroom.schedules && classroom.schedules.length > 0 && (
                        <p className="flex gap-2">
                          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{classroom.schedules.map(formatSchedule).join(" • ")}</span>
                        </p>
                      )}
                      <p className="flex gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {classroom.centerName}, {classroom.province}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Form gửi yêu cầu */}
          <form onSubmit={handleSubmit}>
            <Card className="sticky top-24">
              <h2 className="font-bold">Thông tin yêu cầu</h2>

              <div className="mt-4 space-y-4">
                {/* Chọn thẻ */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Thẻ học viên</span>
                  <select
                    value={selectedCardId}
                    onChange={(e) => {
                      setSelectedCardId(e.target.value)
                      setSelectedClassroomId("")
                    }}
                    className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {activeCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.classroomName} ({card.remainingSession} buổi còn lại)
                      </option>
                    ))}
                  </select>
                </label>

                {/* Lớp được chọn */}
                {selectedClassroomId && (
                  <div className="rounded-md bg-secondary p-3 text-sm">
                    <p className="font-semibold">
                      {classrooms.find((c) => String(c.id) === String(selectedClassroomId))?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {classrooms.find((c) => String(c.id) === String(selectedClassroomId))?.centerName}
                    </p>
                  </div>
                )}
              
                {/* Ngày vắng */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Ngày vắng mặt</span>
                  <input
                    type="date"
                    value={absenceDate}
                    min={today}
                    onChange={(e) => setAbsenceDate(e.target.value)}
                    className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>

                {/* Lý do */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Lý do vắng</span>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Mô tả lý do bất khả kháng (công việc, sức khỏe, ...)"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}
              {success && (
                <p className="mt-4 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {success}
                </p>
              )}

              <Button
                className="mt-5 w-full"
                disabled={submitting || hasUsedMakeupThisMonth || !selectedClassroomIsAvailable || !absenceDate}
              >
                {hasUsedMakeupThisMonth ? "Đã hết lượt tháng này" : "Gửi yêu cầu học bù"}
              </Button>

              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Yêu cầu sẽ được nhân viên trung tâm xét duyệt. Mỗi tháng chỉ được 1 lần.
              </p>
            </Card>
          </form>
        </div>
      )}

      {/* Lịch sử yêu cầu */}
      {myRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold">Lịch sử xin học bù</h2>
          <div className="space-y-3">
            {myRequests.map((req) => (
              <Card key={req.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{req.targetClassroomName}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs ${statusStyles[req.status] || "bg-secondary"}`}>
                      {statusLabels[req.status] || req.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lớp gốc: {req.sourceClassroomName} • {req.targetCenterName}, {req.targetProvince}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      Vắng ngày: {formatDate(req.absenceDate)}
                    </span>
                    <span>Gửi: {formatDateTime(req.createdAt)}</span>
                  </div>
                  {req.staffNote && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ghi chú: <span className="text-foreground">{req.staffNote}</span>
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
