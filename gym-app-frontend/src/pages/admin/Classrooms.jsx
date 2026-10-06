import { useEffect, useMemo, useState } from "react"
import {
  BookOpenCheck,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import {
  createClassroom,
  getCenters,
  getClassrooms,
  getCourses,
  getTrainers,
  setClassroomStatus,
  updateClassroom,
} from "../../services/adminService.js"

const statuses = [
  { value: "RECRUITING", label: "Đang chiêu sinh" },
  { value: "IN_PROGRESS", label: "Đang học" },
  { value: "COMPLETED", label: "Đã kết thúc" },
  { value: "CANCELLED", label: "Đã hủy" },
]

const statusStyles = {
  RECRUITING: "bg-blue-500/15 text-blue-300",
  IN_PROGRESS: "bg-emerald-500/15 text-emerald-300",
  COMPLETED: "bg-violet-500/15 text-violet-300",
  CANCELLED: "bg-red-500/15 text-red-300",
}

const days = [
  { value: "MONDAY", label: "Thứ Hai", short: "T2" },
  { value: "TUESDAY", label: "Thứ Ba", short: "T3" },
  { value: "WEDNESDAY", label: "Thứ Tư", short: "T4" },
  { value: "THURSDAY", label: "Thứ Năm", short: "T5" },
  { value: "FRIDAY", label: "Thứ Sáu", short: "T6" },
  { value: "SATURDAY", label: "Thứ Bảy", short: "T7" },
  { value: "SUNDAY", label: "Chủ Nhật", short: "CN" },
]

const levelLabels = {
  BASIC: "Cơ bản",
  ADVANCED: "Nâng cao",
  PROFESSIONAL: "Chuyên nghiệp",
}

const emptyForm = {
  code: "",
  name: "",
  courseId: "",
  centerId: "",
  trainerId: "",
  recruitmentStartDate: "",
  recruitmentEndDate: "",
  startDate: "",
  endDate: "",
  maxCapacity: "30",
  schedules: [{ dayOfWeek: "MONDAY", startTime: "18:00", endTime: "19:30" }],
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function getStatusLabel(status) {
  return statuses.find((item) => item.value === status)?.label || status
}

function getDayShort(day) {
  return days.find((item) => item.value === day)?.short || day
}

function formatDate(value) {
  if (!value) return "Chưa đặt"
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`))
}

function formatSchedules(schedules = []) {
  if (!schedules.length) return "Chưa có lịch"
  return schedules
    .map((schedule) => `${getDayShort(schedule.dayOfWeek)} ${schedule.startTime?.slice(0, 5)}-${schedule.endTime?.slice(0, 5)}`)
    .join(" | ")
}

function newSchedule() {
  return { dayOfWeek: "MONDAY", startTime: "18:00", endTime: "19:30" }
}

function SelectField({ id, label, children, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-2 block text-sm font-semibold">{label}</span>}
      <select id={id} className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" {...props}>
        {children}
      </select>
    </label>
  )
}

function ClassroomDialog({ classroom, centers, courses, trainers, onClose, onSaved }) {
  const [form, setForm] = useState(classroom ? {
    code: classroom.code || "",
    name: classroom.name || "",
    courseId: String(classroom.courseId ?? ""),
    centerId: String(classroom.centerId ?? ""),
    trainerId: String(classroom.trainerId ?? ""),
    recruitmentStartDate: classroom.recruitmentStartDate || "",
    recruitmentEndDate: classroom.recruitmentEndDate || "",
    startDate: classroom.startDate || "",
    endDate: classroom.endDate || "",
    maxCapacity: String(classroom.maxCapacity ?? 30),
    schedules: classroom.schedules?.length
      ? classroom.schedules.map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime: startTime?.slice(0, 5) || "",
          endTime: endTime?.slice(0, 5) || "",
        }))
      : [newSchedule()],
  } : {
    ...emptyForm,
    courseId: courses[0]?.id ? String(courses[0].id) : "",
    centerId: centers[0]?.id ? String(centers[0].id) : "",
    trainerId: trainers[0]?.id ? String(trainers[0].id) : "",
  })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const updateSchedule = (index, field, value) => {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.map((schedule, itemIndex) =>
        itemIndex === index ? { ...schedule, [field]: value } : schedule,
      ),
    }))
  }

  const addSchedule = () => {
    setForm((current) => ({ ...current, schedules: [...current.schedules, newSchedule()] }))
  }

  const removeSchedule = (index) => {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!form.code.trim() || !form.name.trim()) {
      setError("Mã lớp và tên lớp không được để trống.")
      return
    }
    if (!form.courseId || !form.centerId || !form.trainerId) {
      setError("Vui lòng chọn khóa học, cơ sở và huấn luyện viên.")
      return
    }
    if (!form.recruitmentStartDate || !form.recruitmentEndDate || !form.startDate || !form.endDate) {
      setError("Vui lòng nhập đầy đủ các mốc thời gian.")
      return
    }
    if (!Number.isInteger(Number(form.maxCapacity)) || Number(form.maxCapacity) <= 0) {
      setError("Sĩ số tối đa phải là số nguyên lớn hơn 0.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        courseId: Number(form.courseId),
        centerId: Number(form.centerId),
        trainerId: Number(form.trainerId),
        recruitmentStartDate: form.recruitmentStartDate,
        recruitmentEndDate: form.recruitmentEndDate,
        startDate: form.startDate,
        endDate: form.endDate,
        maxCapacity: Number(form.maxCapacity),
        schedules: form.schedules,
      }
      const saved = classroom
        ? await updateClassroom(classroom.id, payload)
        : await createClassroom(payload)
      onSaved(saved)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Quản lý lớp học</p>
            <h2 className="mt-1 text-xl font-bold">{classroom ? "Cập nhật lớp học" : "Mở lớp mới"}</h2>
          </div>
          <button type="button" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={onClose}>
            Đóng
          </button>
        </div>

        <form className="space-y-6 p-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="class-code" name="code" label="Mã lớp" value={form.code} onChange={handleChange} placeholder="FIT-CB-001" autoFocus />
            <Input id="class-name" name="name" label="Tên lớp" value={form.name} onChange={handleChange} placeholder="Fitness nền tảng 01" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SelectField id="class-course" name="courseId" label="Khóa học" value={form.courseId} onChange={handleChange}>
              <option value="">Chọn khóa học</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </SelectField>
            <SelectField id="class-center" name="centerId" label="Cơ sở" value={form.centerId} onChange={handleChange}>
              <option value="">Chọn cơ sở</option>
              {centers.map((center) => <option key={center.id} value={center.id}>{center.name} - {center.province}</option>)}
            </SelectField>
            <SelectField id="class-trainer" name="trainerId" label="Huấn luyện viên" value={form.trainerId} onChange={handleChange}>
              <option value="">Chọn huấn luyện viên</option>
              {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name || trainer.email}</option>)}
            </SelectField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input id="recruitment-start" name="recruitmentStartDate" type="date" label="Bắt đầu chiêu sinh" value={form.recruitmentStartDate} onChange={handleChange} />
            <Input id="recruitment-end" name="recruitmentEndDate" type="date" label="Kết thúc chiêu sinh" value={form.recruitmentEndDate} onChange={handleChange} />
            <Input id="class-start" name="startDate" type="date" label="Ngày khai giảng" value={form.startDate} onChange={handleChange} />
            <Input id="class-end" name="endDate" type="date" label="Ngày kết thúc" value={form.endDate} onChange={handleChange} />
          </div>

          <Input id="max-capacity" name="maxCapacity" type="number" min="1" step="1" label="Sĩ số tối đa" value={form.maxCapacity} onChange={handleChange} />

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold">Lịch học trong tuần</h3>
                <p className="mt-1 text-xs text-muted-foreground">Mỗi thứ hiện chỉ khai báo một khung giờ.</p>
              </div>
              <Button type="button" variant="outline" onClick={addSchedule}>
                Thêm lịch
              </Button>
            </div>

            <div className="space-y-3">
              {form.schedules.map((schedule, index) => (
                <div key={`${index}-${schedule.dayOfWeek}`} className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                  <SelectField id={`schedule-day-${index}`} label="Thứ" value={schedule.dayOfWeek} onChange={(event) => updateSchedule(index, "dayOfWeek", event.target.value)}>
                    {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                  </SelectField>
                  <Input id={`schedule-start-${index}`} type="time" label="Bắt đầu" value={schedule.startTime} onChange={(event) => updateSchedule(index, "startTime", event.target.value)} />
                  <Input id={`schedule-end-${index}`} type="time" label="Kết thúc" value={schedule.endTime} onChange={(event) => updateSchedule(index, "endTime", event.target.value)} />
                  <button type="button" className="flex h-11 items-center justify-center rounded-md border border-border px-3 text-sm text-muted-foreground hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40" onClick={() => removeSchedule(index)} disabled={form.schedules.length === 1}>
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

          {!trainers.length && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Chưa có tài khoản TRAINER đang hoạt động.
            </p>
          )}
          {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving || !trainers.length || !courses.length || !centers.length}>
              {saving ? "Đang lưu..." : classroom ? "Lưu thay đổi" : "Mở lớp"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([])
  const [centers, setCenters] = useState([])
  const [courses, setCourses] = useState([])
  const [trainers, setTrainers] = useState([])
  const [search, setSearch] = useState("")
  const [centerFilter, setCenterFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState(null)
  const [changingId, setChangingId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [classroomData, centerData, courseData, trainerData] = await Promise.all([
        getClassrooms(),
        getCenters(),
        getCourses(true),
        getTrainers(),
      ])
      setClassrooms(classroomData)
      setCenters(centerData)
      setCourses(courseData)
      setTrainers(trainerData)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredClassrooms = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    return classrooms.filter((classroom) => {
      const matchesKeyword = !keyword
        || [classroom.code, classroom.name, classroom.courseName, classroom.trainerName, classroom.province]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase("vi").includes(keyword))
      const matchesCenter = centerFilter === "ALL" || String(classroom.centerId) === centerFilter
      const matchesStatus = statusFilter === "ALL" || classroom.status === statusFilter
      return matchesKeyword && matchesCenter && matchesStatus
    })
  }, [classrooms, search, centerFilter, statusFilter])

  const handleSaved = (saved) => {
    setClassrooms((current) => {
      const exists = current.some((classroom) => classroom.id === saved.id)
      return exists
        ? current.map((classroom) => classroom.id === saved.id ? saved : classroom)
        : [saved, ...current]
    })
    setDialogOpen(false)
    setEditingClassroom(null)
  }

  const handleCancelClassroom = async (classroom) => {
    if (!window.confirm(`Hủy lớp "${classroom.name}"?`)) return
    setChangingId(classroom.id)
    setError("")
    try {
      const updated = await setClassroomStatus(classroom.id, "CANCELLED")
      setClassrooms((current) =>
        current.map((item) => item.id === updated.id ? updated : item),
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setChangingId(null)
    }
  }

  const canOpenClass = centers.length && courses.length && trainers.length

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Đào tạo</p>
          <h1 className="mt-2 text-3xl font-bold">Lớp học</h1>
          <p className="mt-2 text-sm text-muted-foreground">Trạng thái lớp được tự động xác định theo ngày chiêu sinh và ngày học.</p>
        </div>
        <Button onClick={() => { setEditingClassroom(null); setDialogOpen(true) }} disabled={!canOpenClass}>
          Mở lớp mới
        </Button>
      </div>

      <Card className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_200px_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="class-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã, tên lớp, khóa học, HLV..." />
          </div>
          <select value={centerFilter} onChange={(event) => setCenterFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none">
            <option value="ALL">Tất cả cơ sở</option>
            {centers.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none">
            <option value="ALL">Tất cả trạng thái</option>
            {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
          <p className="whitespace-nowrap text-sm text-muted-foreground">{filteredClassrooms.length} / {classrooms.length} lớp</p>
        </div>
      </Card>

      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span><Button variant="outline" onClick={loadData}>Thử lại</Button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải dữ liệu lớp học...
        </div>
      ) : filteredClassrooms.length === 0 ? (
        <Card className="flex min-h-64 flex-col items-center justify-center text-center">
          <BookOpenCheck className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold">{classrooms.length ? "Không tìm thấy lớp học" : "Chưa mở lớp học nào"}</h2>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredClassrooms.map((classroom) => (
            <Card key={classroom.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-primary">{levelLabels[classroom.level] || classroom.level}</p>
                  <h2 className="mt-2 text-lg font-bold">{classroom.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{classroom.code} - {classroom.courseName}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[classroom.status] || "bg-secondary"}`}>
                  {getStatusLabel(classroom.status)}
                </span>
              </div>

              <div className="mt-5 flex-1 space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><UserRound className="h-4 w-4 shrink-0 text-primary" />HLV {classroom.trainerName || classroom.trainerEmail}</p>
                <p className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{formatSchedules(classroom.schedules)}</span></p>
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{classroom.centerName}, {classroom.province}</span></p>
                <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-primary" />{formatDate(classroom.startDate)} - {formatDate(classroom.endDate)}</p>
                <p className="flex items-center gap-2"><UsersRound className="h-4 w-4 shrink-0 text-primary" />{classroom.currentCapacity}/{classroom.maxCapacity} học viên</p>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
                {classroom.status !== "CANCELLED" && classroom.status !== "COMPLETED" && (
                  <Button variant="outline" onClick={() => handleCancelClassroom(classroom)} disabled={changingId === classroom.id}>
                    {changingId === classroom.id && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Hủy lớp
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setEditingClassroom(classroom); setDialogOpen(true) }}>
                  <Pencil className="h-4 w-4" />Sửa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {dialogOpen && (
        <ClassroomDialog
          classroom={editingClassroom}
          centers={centers}
          courses={courses}
          trainers={trainers}
          onClose={() => { setDialogOpen(false); setEditingClassroom(null) }}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
