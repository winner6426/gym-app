import { useEffect, useMemo, useState } from "react"
import { BookOpenCheck, Building2, LoaderCircle, UsersRound } from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import {
  getCenters,
  getClassrooms,
  getCourses,
  getUsers,
} from "../../services/adminService.js"

const activeClassStatuses = new Set(["RECRUITING", "IN_PROGRESS"])

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0)
}

function getPercent(value, total) {
  if (!total) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

export default function AdminDashboard() {
  const [centers, setCenters] = useState([])
  const [courses, setCourses] = useState([])
  const [users, setUsers] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = async () => {
    setLoading(true)
    setError("")
    try {
      const [centerData, courseData, userData, classroomData] = await Promise.all([
        getCenters(),
        getCourses(),
        getUsers(),
        getClassrooms(),
      ])
      setCenters(centerData)
      setCourses(courseData)
      setUsers(userData)
      setClassrooms(classroomData)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const summary = useMemo(() => {
    const activeMembers = users.filter((user) => user.role === "MEMBER" && !user.disabled).length
    const trainers = users.filter((user) => user.role === "TRAINER" && !user.disabled).length
    const activeCourses = courses.filter((course) => course.active).length
    const activeClasses = classrooms.filter((classroom) => activeClassStatuses.has(classroom.status)).length
    const recruitingClasses = classrooms.filter((classroom) => classroom.status === "RECRUITING").length
    const inProgressClasses = classrooms.filter((classroom) => classroom.status === "IN_PROGRESS").length

    return {
      activeMembers,
      trainers,
      activeCourses,
      activeClasses,
      recruitingClasses,
      inProgressClasses,
    }
  }, [classrooms, courses, users])

  const branchRows = useMemo(() => (
    centers.map((center) => {
      const centerClasses = classrooms.filter((classroom) => String(classroom.centerId) === String(center.id))
      const activeCenterClasses = centerClasses.filter((classroom) => activeClassStatuses.has(classroom.status))
      const currentCapacity = activeCenterClasses.reduce((sum, classroom) => sum + Number(classroom.currentCapacity || 0), 0)
      const maxCapacity = activeCenterClasses.reduce((sum, classroom) => sum + Number(classroom.maxCapacity || 0), 0)

      return {
        id: center.id,
        name: center.name,
        province: center.province,
        members: currentCapacity,
        classes: activeCenterClasses.length,
        capacity: getPercent(currentCapacity, maxCapacity),
      }
    })
  ), [centers, classrooms])

  const todoItems = useMemo(() => {
    const cancelledClasses = classrooms.filter((classroom) => classroom.status === "CANCELLED").length
    const recruitingClasses = classrooms.filter((classroom) => classroom.status === "RECRUITING").length
    const classesWithoutTrainer = classrooms.filter((classroom) => !classroom.trainerId && !classroom.trainerName).length
    const disabledUsers = users.filter((user) => user.disabled).length

    return [
      ["Lớp đã hủy", cancelledClasses],
      ["Lớp đang chiêu sinh", recruitingClasses],
      ["Lớp chưa có huấn luyện viên", classesWithoutTrainer],
      ["Tài khoản đang bị khóa", disabledUsers],
    ]
  }, [classrooms, users])

  const stats = [
    {
      label: "Học viên hoạt động",
      value: formatNumber(summary.activeMembers),

    },
    {
      label: "Lớp đang vận hành",
      value: formatNumber(summary.activeClasses),
   
    },
    {
      label: "Khóa học đang mở",
      value: formatNumber(summary.activeCourses),
  

    },
    {
      label: "Huấn luyện viên",
      value: formatNumber(summary.trainers),
   

    },
  ]

  return (
    <>
      <div className="mb-7">
        <h1 className="mt-2 text-3xl font-bold">Tổng quan hệ thống</h1>
        <p className="mt-2 text-sm text-muted-foreground">Dữ liệu tổng hợp trực tiếp từ hệ thống quản lý.</p>
      </div>

      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <Button variant="outline" onClick={loadDashboard}>Thử lại</Button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải dữ liệu tổng quan...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value }) => (
              <Card key={label}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-2xl font-bold">{value}</p>
              
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="border-t border-border pt-5">
              <h2 className="text-lg font-bold">Tình hình chi nhánh</h2>
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-secondary text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Chi nhánh</th>
                      <th className="px-4 py-3">Học viên</th>
                      <th className="px-4 py-3">Lớp</th>
                      <th className="px-4 py-3">Hiệu suất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchRows.length === 0 ? (
                      <tr className="border-t border-border bg-card">
                        <td className="px-4 py-4 text-muted-foreground" colSpan={4}>Chưa có chi nhánh nào.</td>
                      </tr>
                    ) : branchRows.map((row) => (
                      <tr key={row.id} className="border-t border-border bg-card">
                        <td className="px-4 py-4 font-semibold">
                          {row.name}
                          {row.province && <span className="mt-1 block text-xs font-normal text-muted-foreground">{row.province}</span>}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{formatNumber(row.members)}</td>
                        <td className="px-4 py-4 text-muted-foreground">{formatNumber(row.classes)}</td>
                        <td className="px-4 py-4 text-muted-foreground">{row.capacity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            
          </div>
        </>
      )}
    </>
  )
}
