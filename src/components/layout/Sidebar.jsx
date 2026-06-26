import {
  Activity,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  PauseCircle,
  PlayCircle,
  ReceiptText,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { useAuth } from "../../context/AuthContext.jsx"
import { cn } from "../../utils.js"

const navigationByRole = {
  admin: [
    { label: "Tổng quan", to: "/admin", icon: LayoutDashboard, end: true },
    { label: "Cơ sở", to: "/admin/centers", icon: Building2 },
    { label: "Khóa học", to: "/admin/courses", icon: BookOpenCheck },
    { label: "Người dùng", to: "/admin/users", icon: UsersRound },
    { label: "Lớp học", to: "/admin/classrooms", icon: CalendarCheck },
  ],
  staff: [
    { label: "Duyệt đăng kí học", to: "/staff", icon: LayoutDashboard, end: true },
    { label: "Xác nhận học phí", to: "/staff/payments", icon: ReceiptText },
    { label: "Duyệt bảo lưu", to: "/staff/freeze-requests", icon: PauseCircle },
    { label: "Duyệt học lại", to: "/staff/resume-requests", icon: PlayCircle },
    { label: "Duyệt học bù", to: "/staff/makeup-requests", icon: Search },
  ],
  trainer: [
    { label: "Lớp của tôi", to: "/trainer/classes", icon: BookOpenCheck },
    { label: "Điểm danh", to: "/trainer/attendance", icon: CalendarCheck },
  ],
  member: [
    { label: "Lớp của tôi", to: "/member/classes", icon: BookOpenCheck },
    { label: "Học phí", to: "/member/payments", icon: ReceiptText },
    { label: "Đăng ký học", to: "/member/course-registration", icon: UserRound },
    { label: "Tìm lớp học bù", to: "/member/makeup-class", icon: Search },
    { label: "Xin bảo lưu", to: "/member/reservation", icon: PauseCircle },
    { label: "Học lại sau bảo lưu", to: "/member/resume-course", icon: PlayCircle },
  ],
}

const roleSections = {
  admin: "Quản trị hệ thống",
  staff: "Nhân viên trung tâm",
  trainer: "Huấn luyện viên",
  member: "Học viên",
}

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const items = navigationByRole[user.role] || []

  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={onClose} aria-label="Đóng menu" />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </span>
            <span className="font-bold">Dog2m<span className="text-primary">FITNESS</span></span>
          </Link>
          <button className="flex h-9 w-9 items-center justify-center lg:hidden" onClick={onClose} aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5">
          <p className="mb-3 px-6 text-xs font-semibold uppercase text-muted-foreground">
            {roleSections[user.role] || "Hệ thống"}
          </p>
          <nav className="space-y-1 px-3">
            {items.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-border p-4">
          <Link to="/profile" className="mb-2 flex items-center gap-3 rounded-md p-2 hover:bg-secondary" onClick={onClose}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
              {user.name.trim().slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{user.name || user.email}</span>
  
            </span>
          </Link>
          <Link
            to="/login"
            onClick={() => {
              logout()
              onClose()
            }}
            className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Link>
        </div>
      </aside>
    </>
  )
}
