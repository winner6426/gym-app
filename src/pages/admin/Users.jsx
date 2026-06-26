import { useEffect, useMemo, useState } from "react"
import {
  KeyRound,
  LoaderCircle,
  Lock,
  Pencil,
  Search,
  Trash2,
  Unlock,
  UserPlus,
  UsersRound,
  X,
  Plus
} from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import {
  createUser,
  deleteUser,
  getClassrooms,
  getUsers,
  resetUserPassword,
  setUserDisabled,
  updateUser,
  updateUserRole,
} from "../../services/adminService.js"
import { getMyCards } from "../../services/memberService.js"

const roles = [
  { value: "MEMBER", label: "Học viên" },
  { value: "TRAINER", label: "Huấn luyện viên" },
  { value: "STAFF", label: "Nhân viên" },
  { value: "ADMIN", label: "Quản trị viên" },
]

const emptyForm = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "MEMBER",
}

function getRoleLabel(role) {
  return roles.find((item) => item.value === role)?.label || role
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatDate(value) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`))
}

function hasActiveMemberCard(card) {
  return card.status === "ACTIVE" || card.status === "FROZEN" || Number(card.remainingSession || 0) > 0
}

function getRelatedCount(user, keys) {
  for (const key of keys) {
    const value = user[key]
    if (Array.isArray(value)) return value.length
    if (value !== undefined && value !== null && !Number.isNaN(Number(value))) return Number(value)
  }
  return 0
}

function UserDialog({ selectedUser, onClose, onSaved }) {
  const editing = Boolean(selectedUser)
  const [form, setForm] = useState(editing ? {
    name: selectedUser.name || "",
    email: selectedUser.email || "",
    phoneNumber: selectedUser.phoneNumber || "",
    password: "",
    role: selectedUser.role || "MEMBER",
  } : emptyForm)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!form.name.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      setError("Tên, email và số điện thoại không được để trống.")
      return
    }
    if (!editing && form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }

    setSaving(true)
    try {
      const common = {
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      }
      const saved = editing
        ? await updateUser(selectedUser.id, common)
        : await createUser({ ...common, password: form.password, role: form.role })
      onSaved(saved)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={editing ? "Cập nhật người dùng" : "Thêm người dùng"} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input id="user-name" name="name" label="Họ tên" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" autoFocus />
        <Input id="user-email" name="email" type="email" label="Email" value={form.email} onChange={handleChange} placeholder="user@gym.com" />
        <Input id="user-phone" name="phoneNumber" label="Số điện thoại" value={form.phoneNumber} onChange={handleChange} placeholder="0901234567" />

        {!editing && (
          <>
            <Input id="user-password" name="password" type="password" label="Mật khẩu ban đầu" value={form.password} onChange={handleChange} placeholder="Tối thiểu 6 ký tự" />
            <SelectField id="user-role" name="role" label="Vai trò" value={form.role} onChange={handleChange}>
              {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </SelectField>
          </>
        )}

        {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <DialogActions onClose={onClose} saving={saving} submitLabel={editing ? "Lưu thay đổi" : "Tạo người dùng"} />
      </form>
    </Modal>
  )
}

function PasswordDialog({ selectedUser, onClose }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.")
      return
    }

    setSaving(true)
    try {
      await resetUserPassword(selectedUser.id, password)
      setSuccess(true)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Đặt lại mật khẩu — ${selectedUser.name || selectedUser.email}`} onClose={onClose}>
      {success ? (
        <div>
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Đã cập nhật mật khẩu thành công.</p>
          <div className="mt-5 flex justify-end"><Button onClick={onClose}>Đóng</Button></div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input id="new-password" type="password" label="Mật khẩu mới" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tối thiểu 6 ký tự" autoFocus />
          <Input id="confirm-password" type="password" label="Xác nhận mật khẩu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <DialogActions onClose={onClose} saving={saving} submitLabel="Đổi mật khẩu" />
        </form>
      )}
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><p className="text-xs font-semibold uppercase text-primary">Quản trị tài khoản</p><h2 className="mt-1 text-xl font-bold">{title}</h2></div>
          <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={onClose} aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function DialogActions({ onClose, saving, submitLabel }) {
  return (
    <div className="flex justify-end gap-3 border-t border-border pt-4">
      <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
      <Button type="submit" disabled={saving}>
        {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{submitLabel}
      </Button>
    </div>
  )
}

function SelectField({ id, label, children, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-2 block text-sm font-semibold">{label}</span>}
      <select id={id} className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" {...props}>{children}</select>
    </label>
  )
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [passwordUser, setPasswordUser] = useState(null)
  const [changingId, setChangingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    setError("")
    try {
      setUsers(await getUsers())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    return users.filter((user) => {
      const matchesKeyword = !keyword || [user.name, user.email, user.phoneNumber]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("vi").includes(keyword))
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "ACTIVE" ? !user.disabled : user.disabled)
      return matchesKeyword && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const replaceUser = (updated) => {
    setUsers((current) => {
      const exists = current.some((user) => user.id === updated.id)
      return exists
        ? current.map((user) => user.id === updated.id ? updated : user)
        : [updated, ...current]
    })
  }

  const handleSaved = (saved) => {
    replaceUser(saved)
    setUserDialogOpen(false)
    setEditingUser(null)
  }

  const getTrainerClassCount = async (selectedUser) => {
    const summaryCount = getRelatedCount(selectedUser, [
      "teachingClassCount",
      "trainerClassCount",
      "assignedClassCount",
      "activeClassCount",
      "classroomCount",
      "classCount",
      "classrooms",
    ])
    if (summaryCount) return summaryCount

    const classrooms = await getClassrooms({ trainerId: selectedUser.id })
    const linkedClassrooms = classrooms.filter((classroom) => {
      if (classroom.trainerId !== undefined && classroom.trainerId !== null) {
        return String(classroom.trainerId) === String(selectedUser.id)
      }
      if (classroom.trainerEmail) return classroom.trainerEmail === selectedUser.email
      if (classroom.trainerName) return classroom.trainerName === selectedUser.name
      return false
    })

    return linkedClassrooms.length || classrooms.length
  }

  const getMemberClassCount = async (selectedUser) => {
    const summaryCount = getRelatedCount(selectedUser, [
      "activeCardCount",
      "memberClassCount",
      "enrolledClassCount",
      "activeClassCount",
      "cardCount",
      "cards",
      "registrations",
    ])
    if (summaryCount) return summaryCount

    const cards = await getMyCards(selectedUser.id)
    return cards.filter(hasActiveMemberCard).length
  }

  const confirmRoleChange = async (selectedUser, nextRole) => {
    if (selectedUser.role === nextRole) return false

    try {
      if (selectedUser.role === "TRAINER") {
        const classCount = await getTrainerClassCount(selectedUser)
        if (classCount > 0) {
          return window.confirm(`Huấn luyện viên "${selectedUser.name || selectedUser.email}" đang phụ trách ${classCount} lớp. Đổi vai trò có thể làm các lớp này mất huấn luyện viên. Bạn vẫn muốn đổi sang ${getRoleLabel(nextRole)}?`)
        }
      }

      if (selectedUser.role === "MEMBER") {
        const classCount = await getMemberClassCount(selectedUser)
        if (classCount > 0) {
          return window.confirm(`Học viên "${selectedUser.name || selectedUser.email}" đang có ${classCount} lớp/thẻ học. Đổi vai trò có thể ảnh hưởng đăng ký, thẻ học và điểm danh. Bạn vẫn muốn đổi sang ${getRoleLabel(nextRole)}?`)
        }
      }
    } catch {
      return window.confirm(`Không kiểm tra được lớp đang liên kết với "${selectedUser.name || selectedUser.email}". Bạn vẫn muốn đổi vai trò sang ${getRoleLabel(nextRole)}?`)
    }

    return true
  }

  const confirmDeleteUser = async (selectedUser) => {
    try {
      if (selectedUser.role === "TRAINER") {
        const classCount = await getTrainerClassCount(selectedUser)
        if (classCount > 0) {
          return window.confirm(`Huấn luyện viên "${selectedUser.name || selectedUser.email}" đang phụ trách ${classCount} lớp. Xóa tài khoản có thể làm các lớp này mất huấn luyện viên. Bạn vẫn muốn xóa?`)
        }
      }
    } catch {
      return window.confirm(`Không kiểm tra được lớp đang liên kết với "${selectedUser.name || selectedUser.email}". Bạn vẫn muốn xóa người dùng này?`)
    }

    return window.confirm(`Xóa người dùng "${selectedUser.name || selectedUser.email}"?`)
  }

  const handleRoleChange = async (selectedUser, role) => {
    if (!(await confirmRoleChange(selectedUser, role))) return

    setChangingId(selectedUser.id)
    setError("")
    try {
      replaceUser(await updateUserRole(selectedUser.id, role))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setChangingId(null)
    }
  }

  const handleDelete = async (selectedUser) => {
    if (!(await confirmDeleteUser(selectedUser))) return

    setDeletingId(selectedUser.id)
    setError("")
    try {
      await deleteUser(selectedUser.id)
      setUsers((current) => current.filter((user) => user.id !== selectedUser.id))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleDisabled = async (selectedUser) => {
    const nextDisabled = !selectedUser.disabled
    if (!window.confirm(`${nextDisabled ? "Khóa" : "Mở"} tài khoản "${selectedUser.name || selectedUser.email}"?`)) return
    setChangingId(selectedUser.id)
    setError("")
    try {
      replaceUser(await setUserDisabled(selectedUser.id, nextDisabled))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setChangingId(null)
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="mt-2 text-3xl font-bold">Người dùng</h1><p className="mt-2 text-sm text-muted-foreground">Quản lý học viên, huấn luyện viên, nhân viên và quản trị viên.</p></div>
        <Button onClick={() => { setEditingUser(null); setUserDialogOpen(true) }}><Plus className="h-4 w-4" />Thêm người dùng</Button>
      </div>

      <Card className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_180px_auto] lg:items-center">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="user-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, email hoặc số điện thoại..." /></div>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none"><option value="ALL">Tất cả vai trò</option>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="DISABLED">Đã khóa</option></select>
          <p className="whitespace-nowrap text-sm text-muted-foreground">{filteredUsers.length} / {users.length} người dùng</p>
        </div>
      </Card>

      {error && <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><span>{error}</span><Button variant="outline" onClick={loadUsers}>Thử lại</Button></div>}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải người dùng...</div>
      ) : filteredUsers.length === 0 ? (
        <Card className="flex min-h-64 flex-col items-center justify-center text-center"><UsersRound className="h-12 w-12 text-muted-foreground" /><h2 className="mt-4 text-lg font-bold">{users.length ? "Không tìm thấy người dùng" : "Chưa có người dùng"}</h2></Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground">
              <tr><th className="px-5 py-4">Người dùng</th><th className="px-5 py-4">Điện thoại</th><th className="px-5 py-4">Ngày tạo</th><th className="px-5 py-4">Vai trò</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((selectedUser) => {
                const isCurrentUser = String(selectedUser.id) === String(currentUser.id)
                return (
                  <tr key={selectedUser.id} className="border-t border-border bg-card align-middle">
                    <td className="px-5 py-4"><div className="font-semibold">{selectedUser.name || "Chưa cập nhật tên"}{isCurrentUser && <span className="ml-2 text-xs text-primary">(Bạn)</span>}</div><div className="mt-1 text-xs text-muted-foreground">{selectedUser.email}</div></td>
                    <td className="px-5 py-4 text-muted-foreground">{selectedUser.phoneNumber}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(selectedUser.createdDate)}</td>
                    <td className="px-5 py-4">
                      <select value={selectedUser.role} onChange={(event) => handleRoleChange(selectedUser, event.target.value)} disabled={isCurrentUser || changingId === selectedUser.id || deletingId === selectedUser.id} className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none disabled:opacity-60">
                        {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${selectedUser.disabled ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}`}>{selectedUser.disabled ? "Đã khóa" : "Đang hoạt động"}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30" onClick={() => { setEditingUser(selectedUser); setUserDialogOpen(true) }} disabled={deletingId === selectedUser.id} title="Chỉnh sửa"><Pencil className="h-4 w-4" /></button>
                        <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30" onClick={() => setPasswordUser(selectedUser)} disabled={deletingId === selectedUser.id} title="Đặt lại mật khẩu"><KeyRound className="h-4 w-4" /></button>
                        <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30" onClick={() => handleToggleDisabled(selectedUser)} disabled={isCurrentUser || changingId === selectedUser.id || deletingId === selectedUser.id} title={selectedUser.disabled ? "Mở tài khoản" : "Khóa tài khoản"}>{selectedUser.disabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</button>
                        <button className="rounded-md p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30" onClick={() => handleDelete(selectedUser)} disabled={isCurrentUser || changingId === selectedUser.id || deletingId === selectedUser.id} title="Xóa người dùng">{deletingId === selectedUser.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {userDialogOpen && <UserDialog selectedUser={editingUser} onClose={() => { setUserDialogOpen(false); setEditingUser(null) }} onSaved={handleSaved} />}
      {passwordUser && <PasswordDialog selectedUser={passwordUser} onClose={() => setPasswordUser(null)} />}
    </>
  )
}
