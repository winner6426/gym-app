import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock3, LoaderCircle, MapPin, PlayCircle, Search, UserRound } from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { getMyFreezeRequests, getResumeClassrooms, resumeFreezeRequest } from "../../services/memberService.js"

const levelLabels = { BASIC: "Cơ bản", ADVANCED: "Nâng cao", PROFESSIONAL: "Chuyên nghiệp" }
const dayLabels = {
  MONDAY: "Thứ Hai",
  TUESDAY: "Thứ Ba",
  WEDNESDAY: "Thứ Tư",
  THURSDAY: "Thứ Năm",
  FRIDAY: "Thứ Sáu",
  SATURDAY: "Thứ Bảy",
  SUNDAY: "Chủ Nhật",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`)) : "Chưa có"
}

function formatSchedules(schedules = []) {
  if (!schedules.length) return "Chưa có lịch"
  return schedules
    .map((schedule) => `${dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek} ${schedule.startTime?.slice(0, 5)}-${schedule.endTime?.slice(0, 5)}`)
    .join(" | ")
}

export default function ResumeCourse() {
  const { user } = useAuth()
  const [freezeRequests, setFreezeRequests] = useState([])
  const [selectedFreezeId, setSelectedFreezeId] = useState("")
  const [province, setProvince] = useState("")
  const [resumeDate, setResumeDate] = useState(new Date().toISOString().slice(0, 10))
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroomId, setSelectedClassroomId] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getMyFreezeRequests(user.id, "FROZEN")
      setFreezeRequests(data)
      if (data.length) setSelectedFreezeId(String(data[0].id))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [user.id])

  const selectedFreeze = useMemo(
    () => freezeRequests.find((item) => String(item.id) === String(selectedFreezeId)),
    [freezeRequests, selectedFreezeId],
  )
  const selectedClassroom = classrooms.find((item) => String(item.id) === String(selectedClassroomId))

  const handleSearch = async (event) => {
    event?.preventDefault()
    setError("")
    setSuccess("")
    setHasSearched(true)
    setSelectedClassroomId("")
    if (!selectedFreezeId) {
      setError("Vui lòng chọn yêu cầu bảo lưu cần học lại.")
      return
    }
    setSearching(true)
    try {
      const data = await getResumeClassrooms({
        userId: Number(user.id),
        freezeRequestId: Number(selectedFreezeId),
        province: province.trim(),
      })
      setClassrooms(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    if (!selectedFreezeId) {
      setError("Vui lòng chọn yêu cầu bảo lưu.")
      return
    }
    if (!selectedClassroomId) {
      setError("Vui lòng chọn lớp học lại.")
      return
    }
    if (!resumeDate) {
      setError("Vui lòng chọn ngày muốn bắt đầu học lại.")
      return
    }
    setSaving(true)
    try {
      const updated = await resumeFreezeRequest(selectedFreezeId, {
        userId: Number(user.id),
        targetClassroomId: Number(selectedClassroomId),
        resumeDate,
      })
      setSuccess(`Đã học lại BL-${updated.id}. Lớp của bạn đã được chuyển sang lớp mới.`)
      setFreezeRequests((current) => current.filter((item) => String(item.id) !== String(selectedFreezeId)))
      setClassrooms([])
      setSelectedFreezeId("")
      setSelectedClassroomId("")
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="mt-2 text-3xl font-bold">Tiếp tục học sau bảo lưu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chọn yêu cầu bảo lưu, tìm lớp cùng khóa học và còn chỗ để dùng tiếp số buổi còn lại.
        </p>
      </div>

      {error && <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {success && <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-5 w-5" />{success}</p>}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải yêu cầu bảo lưu...
        </div>
      ) : freezeRequests.length === 0 ? (
        <Card className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
          Bạn chưa có khóa học nào đang bảo lưu.
        </Card>
      ) : (
        <>
          <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]" onSubmit={handleSearch}>
            <label className="block" htmlFor="resume-freeze">
              <span className="mb-2 block text-sm font-semibold">Yêu cầu bảo lưu</span>
              <select id="resume-freeze" value={selectedFreezeId} onChange={(event) => setSelectedFreezeId(event.target.value)} className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none">
                {freezeRequests.map((item) => (
                  <option key={item.id} value={item.id}>
                    BL-{item.id} - {item.classroomName} - còn {item.remainingSession} buổi
                  </option>
                ))}
              </select>
            </label>
            <Input label="Ngày muốn bắt đầu" type="date" value={resumeDate} onChange={(event) => setResumeDate(event.target.value)} />
            <Input label="Tỉnh/Thành phố" value={province} onChange={(event) => setProvince(event.target.value)} placeholder="Bỏ trống để tìm tất cả" />
            <div className="flex items-end">
              <Button className="h-11 w-full lg:w-auto" disabled={searching}>
                {searching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Tìm lớp
              </Button>
            </div>
          </form>

          {selectedFreeze && (
            <Card className="mt-5 grid gap-4 border-primary/30 bg-primary/10 sm:grid-cols-4">
              <div><p className="text-xs text-muted-foreground">Mã bảo lưu</p><p className="mt-1 font-semibold">BL-{selectedFreeze.id}</p></div>
              <div><p className="text-xs text-muted-foreground">Khóa trước</p><p className="mt-1 font-semibold">{selectedFreeze.courseName}</p></div>
              <div><p className="text-xs text-muted-foreground">Còn lại</p><p className="mt-1 font-semibold text-primary">{selectedFreeze.remainingSession} buổi</p></div>
              <div><p className="text-xs text-muted-foreground">Hạn quay lại</p><p className="mt-1 font-semibold">{formatDate(selectedFreeze.endDate)}</p></div>
            </Card>
          )}

          {hasSearched && classrooms.length === 0 ? (
            <Card className="mt-6 flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
              Không tìm thấy lớp cùng khóa học còn chỗ theo điều kiện đã chọn.
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
              <div className="grid gap-4 lg:grid-cols-2">
                {classrooms.map((classroom) => (
                  <button key={classroom.id} type="button" onClick={() => setSelectedClassroomId(String(classroom.id))} className={`rounded-lg border bg-card p-5 text-left transition-colors ${String(classroom.id) === String(selectedClassroomId) ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}>
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-primary">{classroom.code} - {levelLabels[classroom.level] || classroom.level}</p>
                        <h2 className="mt-2 font-bold">{classroom.name}</h2>
                      </div>
                      <span className="h-fit rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">Còn {classroom.maxCapacity - classroom.currentCapacity} chỗ</span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p className="flex gap-2"><MapPin className="h-4 w-4 text-primary" />{classroom.centerName}, {classroom.province}</p>
                      <p className="flex gap-2"><Clock3 className="h-4 w-4 text-primary" />{formatSchedules(classroom.schedules)}</p>
                      <p className="flex gap-2"><UserRound className="h-4 w-4 text-primary" />HLV {classroom.trainerName}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Card className="h-fit">
                
                <h2 className="mt-4 font-bold">Xác nhận học lại</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Lớp đã chọn</dt><dd className="text-right">{selectedClassroom?.name || "Chưa chọn"}</dd></div>
                  
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Trình độ</dt><dd>{selectedFreeze ? levelLabels[selectedFreeze.level] || selectedFreeze.level : ""}</dd></div>
                </dl>
                <Button className="mt-6 w-full" disabled={saving || !selectedClassroomId}>
                  {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Xác nhận học lại
                </Button>
              </Card>
            </form>
          )}
        </>
      )}
    </>
  )
}
