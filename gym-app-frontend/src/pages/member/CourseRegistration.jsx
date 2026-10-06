import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Phone,
  Send,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import {
  cancelRegistration,
  createRegistration,
  getMyRegistrations,
  getRecruitingClassrooms,
} from "../../services/memberService.js"

const days = [
  { value: "MONDAY", label: "Thứ Hai", short: "T2" },
  { value: "TUESDAY", label: "Thứ Ba", short: "T3" },
  { value: "WEDNESDAY", label: "Thứ Tư", short: "T4" },
  { value: "THURSDAY", label: "Thứ Năm", short: "T5" },
  { value: "FRIDAY", label: "Thứ Sáu", short: "T6" },
  { value: "SATURDAY", label: "Thứ Bảy", short: "T7" },
  { value: "SUNDAY", label: "Chủ Nhật", short: "CN" },
]

const levelLabels = { BASIC: "Cơ bản", ADVANCED: "Nâng cao", PROFESSIONAL: "Chuyên nghiệp" }

const statusLabels = {
  PENDING_CONFIRMATION: "Chờ gọi xác nhận",
  CONTACTED: "Đã xác nhận",
  WAITING_PAYMENT: "Chờ nộp học phí",
  PAID: "Đã thanh toán",
  ENROLLED: "Đã xếp lớp",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
}

const statusStyles = {
  PENDING_CONFIRMATION: "bg-amber-500/10 text-amber-200",
  CONTACTED: "bg-blue-500/10 text-blue-200",
  WAITING_PAYMENT: "bg-violet-500/10 text-violet-200",
  PAID: "bg-emerald-500/10 text-emerald-200",
  ENROLLED: "bg-emerald-500/10 text-emerald-200",
  REJECTED: "bg-red-500/10 text-red-200",
  CANCELLED: "bg-zinc-500/10 text-zinc-300",
  EXPIRED: "bg-zinc-500/10 text-zinc-300",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function dayShort(day) {
  return days.find((item) => item.value === day)?.short || day
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`)) : "—"
}

function formatSchedules(schedules = []) {
  return schedules.map((schedule) =>
    `${dayShort(schedule.dayOfWeek)} ${schedule.startTime?.slice(0, 5)}–${schedule.endTime?.slice(0, 5)}`,
  ).join(" • ")
}

function formatAvailabilities(availabilities = []) {
  if (!availabilities.length) return "Chưa chọn"
  return availabilities.map((item) =>
    `${dayShort(item.dayOfWeek)} ${item.startTime?.slice(0, 5)}–${item.endTime?.slice(0, 5)}`,
  ).join(" • ")
}

function defaultAvailability() {
  return { dayOfWeek: "MONDAY", startTime: "18:00", endTime: "21:00" }
}

export default function CourseRegistration() {
  const { user } = useAuth()
  const [classrooms, setClassrooms] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [selectedClassroomId, setSelectedClassroomId] = useState("")
  const [availabilities, setAvailabilities] = useState([])
  const [note, setNote] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("ALL")
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [classroomData, registrationData] = await Promise.all([
        getRecruitingClassrooms(),
        getMyRegistrations(user.id),
      ])
      setClassrooms(classroomData)
      setRegistrations(registrationData)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [user.id])

  const provinces = useMemo(() => [...new Set(classrooms.map((item) => item.province).filter(Boolean))], [classrooms])

  const filteredClassrooms = useMemo(() =>
    classrooms.filter((classroom) =>
      (provinceFilter === "ALL" || classroom.province === provinceFilter)
      && (levelFilter === "ALL" || classroom.level === levelFilter),
    ), [classrooms, provinceFilter, levelFilter])

  const selectedClassroom = classrooms.find((classroom) => String(classroom.id) === String(selectedClassroomId))

  const selectClassroom = (classroom) => {
    setSelectedClassroomId(String(classroom.id))
    setAvailabilities(
      classroom.schedules?.length
        ? classroom.schedules.map((schedule) => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime?.slice(0, 5) || "18:00",
            endTime: schedule.endTime?.slice(0, 5) || "21:00",
          }))
        : [defaultAvailability()],
    )
    setSuccess("")
    setError("")
  }

  const updateAvailability = (index, field, value) => {
    setAvailabilities((current) =>
      current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    if (!selectedClassroomId) {
      setError("Vui lòng chọn một lớp đang chiêu sinh.")
      return
    }
    if (!availabilities.length) {
      setError("Vui lòng chọn ít nhất một khoảng thời gian có thể theo học.")
      return
    }
    if (availabilities.some((item) => !item.dayOfWeek || !item.startTime || !item.endTime || item.startTime >= item.endTime)) {
      setError("Mỗi khoảng thời gian phải có thứ, giờ bắt đầu và giờ kết thúc hợp lệ.")
      return
    }

    setSubmitting(true)
    try {
      const created = await createRegistration({
        userId: Number(user.id),
        classroomId: Number(selectedClassroomId),
        availabilities,
        note: note.trim(),
      })
      setRegistrations((current) => [created, ...current])
      setSuccess("Đã gửi đăng ký. Nhân viên trung tâm sẽ liên hệ xác nhận qua điện thoại.")
      setSelectedClassroomId("")
      setAvailabilities([])
      setNote("")
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (registration) => {
    if (!window.confirm(`Hủy đăng ký lớp "${registration.classroomName}"?`)) return
    setCancellingId(registration.id)
    setError("")
    try {
      const updated = await cancelRegistration(registration.id, user.id)
      setRegistrations((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center text-muted-foreground"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải lớp chiêu sinh...</div>

  return (
    <>
      <div className="mb-7">
       
        <h1 className="mt-2 text-3xl font-bold">Đăng ký học</h1>
        <p className="mt-2 text-sm text-muted-foreground">Chọn lớp và cho trung tâm biết ngày, giờ bạn có thể theo học.</p>
      </div>

      {error && <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {success && <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-5 w-5" />{success}</p>}

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={provinceFilter} onChange={(event) => setProvinceFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none">
            <option value="ALL">Tất cả tỉnh/thành phố</option>
            {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
          </select>
          <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none">
            <option value="ALL">Tất cả trình độ</option>
            <option value="BASIC">Cơ bản</option>
            <option value="ADVANCED">Nâng cao</option>
            <option value="PROFESSIONAL">Chuyên nghiệp</option>
          </select>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section>
          <h2 className="mb-4 text-lg font-bold">Lớp đang chiêu sinh</h2>
          {filteredClassrooms.length === 0 ? (
            <Card className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">Không có lớp phù hợp với bộ lọc hiện tại.</Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredClassrooms.map((classroom) => (
                <button key={classroom.id} type="button" onClick={() => selectClassroom(classroom)} className={`rounded-lg border bg-card p-5 text-left transition-colors ${String(classroom.id) === String(selectedClassroomId) ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-primary">{levelLabels[classroom.level]}</p><h3 className="mt-2 font-bold">{classroom.name}</h3><p className="mt-1 text-xs text-muted-foreground">{classroom.code} • {classroom.courseName}</p></div><span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-200">Chiêu sinh</span></div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p className="flex gap-2"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />HLV {classroom.trainerName}</p>
                    <p className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{formatSchedules(classroom.schedules)}</span></p>
                    <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{classroom.centerName}, {classroom.province}</span></p>
                    <p className="flex gap-2"><UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Còn {classroom.maxCapacity - classroom.currentCapacity} chỗ</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit}>
          <Card className="sticky top-24">
            <h2 className="font-bold">Thông tin đăng ký</h2>
            {selectedClassroom ? (
              <>
                <div className="mt-4 rounded-md bg-secondary p-4">
                  <p className="font-semibold">{selectedClassroom.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedClassroom.centerName} • Khai giảng {formatDate(selectedClassroom.startDate)}</p>
                </div>
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Ngày và giờ có thể học</p>
                    <button type="button" onClick={() => setAvailabilities((current) => [...current, defaultAvailability()])} className="text-xs font-semibold text-primary">+ Thêm</button>
                  </div>
                  <div className="space-y-3">
                    {availabilities.map((availability, index) => (
                      <div key={`${availability.dayOfWeek}-${index}`} className="grid gap-2 rounded-md border border-border p-3">
                        <select value={availability.dayOfWeek} onChange={(event) => updateAvailability(index, "dayOfWeek", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none">
                          {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                        </select>
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                          <input type="time" value={availability.startTime} onChange={(event) => updateAvailability(index, "startTime", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none" />
                          <input type="time" value={availability.endTime} onChange={(event) => updateAvailability(index, "endTime", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none" />
                          <button type="button" disabled={availabilities.length === 1} onClick={() => setAvailabilities((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-red-300 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-semibold">Ghi chú</span>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Khung giờ thuận tiện để trung tâm liên hệ..." />
                </label>
              </>
            ) : <p className="mt-4 text-sm text-muted-foreground"></p>}
            <Button className="mt-5 w-full" disabled={!selectedClassroom || submitting}>
              Gửi đăng ký
            </Button>
            <p className="mt-3 flex gap-2 text-xs leading-5 text-muted-foreground">Nhân viên sẽ gọi điện xác nhận trước khi gửi thông báo nộp học phí.</p>
          </Card>
        </form>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Đăng ký của tôi</h2>
        {registrations.length === 0 ? (
          <Card className="text-sm text-muted-foreground">Bạn chưa có đăng ký nào.</Card>
        ) : (
          <div className="space-y-3">
            {registrations.map((registration) => (
              <Card key={registration.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{registration.classroomName}</p><span className={`rounded-full px-2.5 py-1 text-xs ${statusStyles[registration.status]}`}>{statusLabels[registration.status]}</span></div><p className="mt-1 text-xs text-muted-foreground">{registration.classroomCode} • {registration.courseName} • {registration.centerName}</p><p className="mt-2 text-xs text-muted-foreground">Ngày gửi: {formatDate(registration.registrationDate)} • Rảnh: {formatAvailabilities(registration.availabilities)}</p></div>
                {registration.status === "PENDING_CONFIRMATION" && <Button variant="outline" disabled={cancellingId === registration.id} onClick={() => handleCancel(registration)}>{cancellingId === registration.id && <LoaderCircle className="h-4 w-4 animate-spin" />}Hủy đăng ký</Button>}
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
