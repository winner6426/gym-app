import { useEffect, useState } from "react"
import { CalendarDays, CheckCircle2, LoaderCircle, Mail, Phone, ShieldCheck, UserRound } from "lucide-react"
import { Button } from "../components/ui/Button.jsx"
import { Card } from "../components/ui/Card.jsx"
import { Input } from "../components/ui/Input.jsx"
import { useAuth } from "../context/AuthContext.jsx"
import { getUserById, updateUser } from "../services/adminService.js"

const roleLabels = {
  admin: "Quản trị viên",
  staff: "Nhân viên",
  trainer: "Huấn luyện viên",
  member: "Học viên",
  ADMIN: "Quản trị viên",
  STAFF: "Nhân viên",
  TRAINER: "Huấn luyện viên",
  MEMBER: "Học viên",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatDate(value) {
  if (!value) return "Chưa có"
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`))
}

export default function Profile() {
  const { user, syncUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name: "", email: "", phoneNumber: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadProfile = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getUserById(user.id)
      setProfile(data)
      setForm({
        name: data.name || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
      })
      syncUser(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [user.id])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!form.name.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      setError("Vui lòng nhập đầy đủ họ tên, email và số điện thoại.")
      return
    }

    setSaving(true)
    try {
      const updated = await updateUser(user.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      })
      setProfile(updated)
      setForm({
        name: updated.name || "",
        email: updated.email || "",
        phoneNumber: updated.phoneNumber || "",
      })
      syncUser(updated)
      setSuccess("Đã lưu thay đổi hồ sơ.")
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const displayUser = profile || user

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase text-primary">Tài khoản</p>
        <h1 className="mt-2 text-3xl font-bold">Hồ sơ cá nhân</h1>
      </div>

      <Card className="p-6 sm:p-8">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-muted-foreground">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải hồ sơ...
          </div>
        ) : (
          <>
            <div className="mb-7 flex items-center gap-4 border-b border-border pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                <UserRound className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{displayUser.name || displayUser.email}</h2>
                <p className="mt-1 text-sm text-muted-foreground">ID #{displayUser.id}</p>
              </div>
            </div>

            {error && <p role="alert" className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            {success && <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-5 w-5" />{success}</p>}

            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
              <Input id="profile-name" name="name" label="Họ và tên" value={form.name} onChange={handleChange} />
              <Input id="profile-email" name="email" label="Email" type="email" value={form.email} onChange={handleChange} />
              <Input id="profile-phone" name="phoneNumber" label="Số điện thoại" value={form.phoneNumber} onChange={handleChange} />
              <Input id="profile-role" label="Vai trò" value={roleLabels[displayUser.role] || displayUser.role || ""} disabled />

              

              <Button className="sm:col-span-2 sm:w-fit" disabled={saving}>
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
