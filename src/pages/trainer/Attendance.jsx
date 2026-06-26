import { AlertTriangle, CheckCircle2, LoaderCircle, Save, Search, XCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import {
  getClassroomStudents,
  getTrainerClassrooms,
  saveAttendance,
} from "../../services/trainerService.js"

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatDate(value) {
  if (!value) return ""
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

function getDefaultAttendanceDate(attendanceDates = []) {
  if (!attendanceDates.length) return ""
  const today = new Date().toISOString().slice(0, 10)
  return attendanceDates.find((date) => date >= today) || attendanceDates[attendanceDates.length - 1]
}

export default function Attendance() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [classes, setClasses] = useState([])
  const [selectedClassroomId, setSelectedClassroomId] = useState(searchParams.get("classroomId") || "")
  const [attendanceDate, setAttendanceDate] = useState("")
  const [students, setStudents] = useState([])
  const [classroomInfo, setClassroomInfo] = useState(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedClassroom = useMemo(
    () => classes.find((classroom) => String(classroom.id) === String(selectedClassroomId)),
    [classes, selectedClassroomId],
  )
  const attendanceDates = classroomInfo?.attendanceDates || selectedClassroom?.attendanceDates || []

  useEffect(() => {
    async function loadClasses() {
      setLoading(true)
      setError("")
      try {
        const data = await getTrainerClassrooms(user.id)
        setClasses(data)

        const nextClassroom = selectedClassroomId
          ? data.find((classroom) => String(classroom.id) === String(selectedClassroomId))
          : data[0]

        if (nextClassroom) {
          setSelectedClassroomId(String(nextClassroom.id))
          setAttendanceDate(getDefaultAttendanceDate(nextClassroom.attendanceDates))
          setSearchParams({ classroomId: String(nextClassroom.id) })
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [user.id])

  useEffect(() => {
    async function loadStudents() {
      if (!selectedClassroomId || !attendanceDate) {
        setStudents([])
        if (!selectedClassroomId) setClassroomInfo(null)
        return
      }

      setLoading(true)
      setError("")
      setSuccess("")
      try {
        const data = await getClassroomStudents(user.id, selectedClassroomId, attendanceDate)
        setClassroomInfo(data)
        setStudents(data.students.map((student) => ({
          ...student,
          attendanceStatus: student.attendanceStatus || "ABSENT",
        })))
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [user.id, selectedClassroomId, attendanceDate])

  useEffect(() => {
    if (!selectedClassroomId || !selectedClassroom) return
    const nextDates = selectedClassroom.attendanceDates || []
    if (nextDates.length && !nextDates.includes(attendanceDate)) {
      setAttendanceDate(getDefaultAttendanceDate(nextDates))
    }
  }, [selectedClassroomId, selectedClassroom, attendanceDate])

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    if (!keyword) return students
    return students.filter((student) =>
      [student.studentName, student.studentPhone, student.studentEmail]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("vi").includes(keyword)),
    )
  }, [students, search])

  const presentCount = students.filter((student) => student.attendanceStatus === "PRESENT").length

  const handleClassroomChange = (event) => {
    const nextId = event.target.value
    const nextClassroom = classes.find((classroom) => String(classroom.id) === String(nextId))
    setSelectedClassroomId(nextId)
    setAttendanceDate(getDefaultAttendanceDate(nextClassroom?.attendanceDates))
    setSearchParams(nextId ? { classroomId: nextId } : {})
  }

  const updateStatus = (studentId, status) => {
    setStudents((current) =>
      current.map((student) =>
        student.studentId === studentId ? { ...student, attendanceStatus: status } : student,
      ),
    )
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")

    if (!selectedClassroomId) {
      setError("Vui lòng chọn lớp cần điểm danh.")
      return
    }
    if (!attendanceDate) {
      setError("Lớp chưa có ngày học hợp lệ để điểm danh.")
      return
    }

    setSaving(true)
    try {
      const data = await saveAttendance(selectedClassroomId, {
        trainerId: Number(user.id),
        attendanceDate,
        records: students.map((student) => ({
          studentId: student.studentId,
          status: student.attendanceStatus,
        })),
      })
      setClassroomInfo(data)
      setStudents(data.students.map((student) => ({
        ...student,
        attendanceStatus: student.attendanceStatus || "ABSENT",
      })))
      setSuccess("Đã lưu điểm danh.")
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-7">
       
        <h1 className="mt-2 text-3xl font-bold">Điểm danh</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chọn lớp, ngày học trong lịch và đánh dấu học viên có mặt/vắng.
        </p>
      </div>

      <Card className="mb-5 grid gap-4 md:grid-cols-[1fr_220px] lg:grid-cols-[1fr_220px_260px]">
        <label>
          <span className="mb-2 block text-sm font-semibold">Lớp học</span>
          <select
            value={selectedClassroomId}
            onChange={handleClassroomChange}
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="">Chọn lớp</option>
            {classes.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.code} - {classroom.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold">Ngày điểm danh</span>
          <select
            id="attendance-date"
            value={attendanceDate}
            onChange={(event) => setAttendanceDate(event.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
            disabled={!attendanceDates.length}
          >
            <option value=""></option>
            {attendanceDates.map((date) => (
              <option key={date} value={date}>{formatDate(date)}</option>
            ))}
          </select>
        </label>

        <div className="relative self-end">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="attendance-search"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm học viên..."
          />
        </div>
      </Card>

      {classroomInfo && (
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">
              {classroomInfo.classroomCode} - {classroomInfo.classroomName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {classroomInfo.courseName} - {classroomInfo.centerName}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Có mặt:{" "}
            <span className="font-bold text-emerald-300">
              {presentCount}/{students.length}
            </span>
          </p>
        </div>
      )}

     

      {error && (
        <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          Đang tải dữ liệu điểm danh...
        </div>
      ) : !selectedClassroomId ? (
        <Card className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Vui lòng chọn một lớp để điểm danh.
        </Card>
      ) : !attendanceDate ? (
        <Card className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Lớp chưa có ngày học hợp lệ để điểm danh.
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Chưa có học viên đã xếp lớp hoặc không tìm thấy học viên phù hợp.
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            {filteredStudents.map((student, index) => (
              <div
                key={student.studentId}
                className={`flex flex-col gap-4 bg-card p-4 sm:flex-row sm:items-center sm:justify-between ${index ? "border-t border-border" : ""}`}
              >
                <div>
                  <p className="font-semibold">{student.studentName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {student.studentPhone || student.studentEmail || `ID ${student.studentId}`}
                  </p>
                  <p className="mt-1 text-xs text-primary">
                    Còn {student.remainingSession ?? 0}/{student.totalSession ?? 0} buổi
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(student.studentId, "PRESENT")}
                    className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm ${student.attendanceStatus === "PRESENT" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-border text-muted-foreground"}`}
                  >
                   
                    Có mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(student.studentId, "ABSENT")}
                    className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm ${student.attendanceStatus === "ABSENT" ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-border text-muted-foreground"}`}
                  >
                   
                    Vắng
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button className="mt-5" onClick={handleSave} disabled={saving}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu điểm danh
          </Button>
        </>
      )}
    </>
  )
}
