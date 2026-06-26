import { CalendarDays, Clock3, LoaderCircle, MapPin, UserRound, UsersRound } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getPublicClassrooms } from "../../services/homeService.js"
import { Button } from "../ui/Button.jsx"

const levelLabels = {
  BASIC: "Cơ bản",
  ADVANCED: "Nâng cao",
  PROFESSIONAL: "Chuyên nghiệp",
}

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
  return error.response?.data?.message || error.message || "Không tải được danh sách lớp chiêu sinh."
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`)) : "Chưa cập nhật"
}

function formatSchedules(schedules = []) {
  if (!schedules.length) return "Chưa cập nhật lịch học"
  return schedules
    .map((schedule) => `${dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek} ${schedule.startTime?.slice(0, 5)}-${schedule.endTime?.slice(0, 5)}`)
    .join(" | ")
}

export function RecruitingClasses() {
  const [classrooms, setClassrooms] = useState([])
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadClassrooms() {
      setLoading(true)
      setError("")
      try {
        const data = await getPublicClassrooms()
        setClassrooms(data)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    loadClassrooms()
  }, [])

  const filteredClassrooms = useMemo(() => (
    classrooms.filter((classroom) => levelFilter === "ALL" || classroom.level === levelFilter)
  ), [classrooms, levelFilter])

  return (
    <section id="classes" className="bg-secondary/30 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div>
            <span className="text-xl font-semibold tracking-wider text-primary uppercase">Các lớp đang chiêu sinh</span>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Danh sách lớp, huấn luyện viên và thời gian chiêu sinh
            </p>
          </div>

          
        </div>

        {error && <p className="mb-8 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center text-muted-foreground">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải lớp chiêu sinh...
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            Hiện chưa có lớp chiêu sinh phù hợp.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {filteredClassrooms.map((classroom) => (
              <article key={classroom.id} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary">{levelLabels[classroom.level] || classroom.level}</p>
                    <h3 className="mt-2 text-xl font-bold text-foreground">{classroom.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{classroom.code} - {classroom.courseName}</p>
                  </div>
                
                </div>

                <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                  <p className="flex gap-2">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    HLV {classroom.trainerName}
                  </p>
                  <p className="flex gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{formatSchedules(classroom.schedules)}</span>
                  </p>
                  <p className="flex gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Chiêu sinh {formatDate(classroom.recruitmentStartDate)} - {formatDate(classroom.recruitmentEndDate)}</span>
                  </p>
                  <p className="flex gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Khai giảng {formatDate(classroom.startDate)}</span>
                  </p>
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{classroom.centerName}, {classroom.province}</span>
                  </p>
                </div>

                <Link to="/login" className="mt-6 block">
                  <Button className="w-full">Đăng ký lớp này</Button>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
