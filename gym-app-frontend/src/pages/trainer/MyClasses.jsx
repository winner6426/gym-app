import { CalendarDays, Clock3, LoaderCircle, MapPin, UsersRound } from "lucide-react"
import { useEffect, useState } from "react"
import { Card } from "../../components/ui/Card.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { getTrainerClassrooms } from "../../services/trainerService.js"

const statusLabels = {
  RECRUITING: "Đang chiêu sinh",
  IN_PROGRESS: "Đang học",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
}

const statusStyles = {
  RECRUITING: "bg-blue-500/10 text-blue-300",
  IN_PROGRESS: "bg-emerald-500/10 text-emerald-300",
  COMPLETED: "bg-violet-500/10 text-violet-300",
  CANCELLED: "bg-red-500/10 text-red-300",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatDate(value) {
  if (!value) return "Chưa có"
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`))
}

export default function MyClasses() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError("")
      try {
        const data = await getTrainerClassrooms(user.id)
        setClasses(data)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user.id])

  return (
    <>
      <div className="mb-7">
        <h1 className="mt-2 text-3xl font-bold">Lớp của tôi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Theo dõi lịch giảng dạy, sĩ số và điểm danh từng lớp.
        </p>
      </div>

      {error && (
        <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          Đang tải lớp học...
        </div>
      ) : classes.length === 0 ? (
        <Card className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Bạn chưa được phân công lớp nào.
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {classes.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-primary">{item.code}</p>
                  <h2 className="mt-2 text-xl font-bold">{item.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.courseName} - {item.level}
                  </p>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status] || "bg-secondary text-muted-foreground"}`}>
                  {statusLabels[item.status] || item.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  {item.schedules?.length ? item.schedules.join(", ") : "Chưa có lịch"}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {item.centerName} - {item.province}
                </p>
                <p className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-primary" />
                  {item.currentCapacity || 0}/{item.maxCapacity || 0} học viên
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
