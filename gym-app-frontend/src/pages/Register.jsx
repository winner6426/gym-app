import { useState } from "react"
import { ArrowLeft, Dumbbell, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button.jsx"
import { registerUser } from "../services/authService.js"

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  })
  const [visiblePassword, setVisiblePassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

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

    if (!form.name.trim() || !form.phoneNumber.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc.")
      return
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.")
      return
    }

    try {
      setIsSubmitting(true)

      await registerUser({
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      navigate("/login", {
        replace: true,
        state: { message: "Đăng ký thành công. Vui lòng đăng nhập." },
      })
    } catch(error) {
      const backendMessage = typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.message
      setError(backendMessage || "Không thể đăng ký tài khoản.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClassName =
    "h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
  const fieldClassName =
    "flex h-12 items-center gap-3 rounded-md border border-border bg-background px-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"

  return (
    <main className="min-h-screen bg-background text-foreground">
      
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-24">

    

        <div className="mx-auto w-full max-w-xl flex-1 items-center py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>

          <div className="w-full rounded-lg border border-border bg-card p-6 shadow-2xl shadow-black/20 sm:p-8">
            <h2 className="text-4xl font-bold leading-tight">Tạo tài khoản</h2>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                  Họ và tên
                </label>
                <div className={fieldClassName}>
                  <UserRound className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="VD: Nguyễn Văn A"
                    autoComplete="name"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                  Email
                </label>
                <div className={fieldClassName}>
                  <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="VD: nguyenvana@example.com"
                    autoComplete="email"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="mb-2 block text-sm font-semibold">
                  Số điện thoại
                </label>
                <div className={fieldClassName}>
                  <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="0xxxxxxxxx"
                    autoComplete="tel"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold">
                    Mật khẩu
                  </label>
                  <div className={fieldClassName}>
                    <LockKeyhole className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <input
                      id="password"
                      name="password"
                      type={visiblePassword === "password" ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu"
                      autoComplete="new-password"
                      className={inputClassName}
                    />
                    <button
                      type="button"
                      onClick={() => setVisiblePassword((current) => current === "password" ? "" : "password")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={visiblePassword === "password" ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={visiblePassword === "password" ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {visiblePassword === "password" ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold">
                    Xác nhận mật khẩu
                  </label>
                  <div className={fieldClassName}>
                    <LockKeyhole className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={visiblePassword === "confirmPassword" ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      autoComplete="new-password"
                      className={inputClassName}
                    />
                    <button
                      type="button"
                      onClick={() => setVisiblePassword((current) => current === "confirmPassword" ? "" : "confirmPassword")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={visiblePassword === "confirmPassword" ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={visiblePassword === "confirmPassword" ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {visiblePassword === "confirmPassword" ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-semibold text-primary transition-colors hover:text-accent">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
