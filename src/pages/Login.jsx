import { useState } from "react"
import { Dumbbell, Lock, Mail, ArrowLeft} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button.jsx"
import { ErrorMessage } from "../components/common/ErrorMessage.jsx"
import { getRoleHome, useAuth } from "../context/AuthContext.jsx"
import { loginUser } from "../services/authService.js"

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!form.email.trim() || !form.password.trim()) {
      setError("Vui lòng nhập email và mật khẩu.")
      return
    }

    try {
      setIsSubmitting(true)

      const authData = await loginUser({ email: form.email, password: form.password })
      const authenticatedUser = login(authData)

      navigate(location.state?.from || getRoleHome(authenticatedUser.role), { replace: true })
    } catch (error) {
      const backendMessage = typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.message

      setError(backendMessage || "Email hoặc mật khẩu không đúng. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 ">
          <section className="mx-auto w-full max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>

            <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-2xl shadow-black/20 sm:p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Đăng nhập</h2>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <div className="flex h-12 items-center gap-3 rounded-md border border-border bg-background px-4 focus-within:border-primary">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="nguyenvana@gmail.com"
                      className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium">
                    Mật khẩu
                  </label>
                  <div className="flex h-12 items-center gap-3 rounded-md border border-border bg-background px-4 focus-within:border-primary">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu"
                      className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 text-sm">
                  <a href="#" className="-translate-x font-medium text-primary transition-colors hover:text-accent">
                    Quên mật khẩu?
                  </a>
                </div>

                <ErrorMessage message={error} />

                <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link to="/register" className="font-medium text-primary transition-colors hover:text-accent">
                  Tạo tài khoản
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
