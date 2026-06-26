import { useState } from "react"
import { Dumbbell, LogOut, Menu, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth, getRoleHome } from "../../context/AuthContext.jsx"
import { Button } from "../ui/Button.jsx"

const navLinks = [
  { name: "Trang chủ", href: "#" },
  { name: "Dịch vụ", href: "#services" },
  { name: "Các lớp học", href: "#classes" },
  { name: "Huấn luyện viên", href: "#trainers" },
  { name: "Đánh giá", href: "#testimonials" },
]

function getInitial(user) {
  return (user?.name || user?.email || "U").trim().charAt(0).toUpperCase()
}

function AccountMenu({ user, onLogout }) {
  return (
    <div className="items-center justify-between absolute right-0 top-full mt-3 w-44 rounded-lg border border-border bg-card p-2 shadow-xl">
      <Link
        to={getRoleHome(user.role)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-secondary"
      >
        Vào hệ thống
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-red-500/10"
      >
        Đăng xuất
      </button>
    </div>
  )
}

export function Navigation() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsAccountOpen(false)
    setIsOpen(false)
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Dog2m<span className="text-primary">FITNESS</span>
            </span>
          </Link>

          <div className="hidden items-center gap-12 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((open) => !open)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-blue-600 text-sm font-bold transition-colors hover:border-primary hover:text-primary"
                  aria-label="Mở menu tài khoản"
                >
                  {getInitial(user)}
                </button>
                {isAccountOpen && <AccountMenu user={user} onLogout={handleLogout} />}
              </div>
            ) : (
              <Link to="/login">
                <Button className="px-6">Đăng nhập</Button>
              </Link>
            )}
          </div>

          <button
            className="text-foreground md:hidden"
            onClick={() => setIsOpen((open) => !open)}
            aria-label="Mở hoặc đóng menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-4 px-4 py-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}

            {user ? (
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                    {getInitial(user)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name || "Tài khoản"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Link
                  to={getRoleHome(user.role)}
                  onClick={() => setIsOpen(false)}
                >
                  <Button className="mt-3 w-full">Vào hệ thống</Button>
                </Link>
                <Button type="button" variant="outline" className="mt-2 w-full text-red-300" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button className="mt-4 w-full">Đăng nhập</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
