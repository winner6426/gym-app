import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  LoaderCircle,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import {
  createCenter,
  deleteCenter,
  getCenters,
  updateCenter,
} from "../../services/adminService.js"

const emptyForm = { name: "", province: "", address: "", phone: "" }

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function CenterDialog({ center, onClose, onSaved }) {
  const [form, setForm] = useState(center ? {
    name: center.name || "",
    province: center.province || "",
    address: center.address || "",
    phone: center.phone || "",
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

    if (!form.name.trim() || !form.province.trim() || !form.address.trim()) {
      setError("Vui lòng nhập tên cơ sở, tỉnh/thành phố và địa chỉ.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        province: form.province.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      }
      const saved = center
        ? await updateCenter(center.id, payload)
        : await createCenter(payload)
      onSaved(saved)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Quản lý cơ sở</p>
            <h2 className="mt-1 text-xl font-bold">
              {center ? "Cập nhật cơ sở" : "Thêm cơ sở mới"}
            </h2>
          </div>
          <button type="button" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={onClose}>
            Đóng
          </button>
        </div>

        <form className="space-y-4 p-5" onSubmit={handleSubmit}>
          <Input id="center-name" name="name" label="Tên cơ sở" value={form.name} onChange={handleChange} placeholder="Ví dụ: Dog2m Fitness Quận 1" autoFocus />
          <Input id="center-province" name="province" label="Tỉnh / Thành phố" value={form.province} onChange={handleChange} placeholder="Ví dụ: Hồ Chí Minh" />
          <Input id="center-address" name="address" label="Địa chỉ" value={form.address} onChange={handleChange} placeholder="Số nhà, đường, quận/huyện" />
          <Input id="center-phone" name="phone" label="Số điện thoại" value={form.phone} onChange={handleChange} placeholder="Không bắt buộc" />

          {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : center ? "Lưu thay đổi" : "Tạo cơ sở"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Centers() {
  const [centers, setCenters] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingCenter, setEditingCenter] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadCenters = async () => {
    setLoading(true)
    setError("")
    try {
      setCenters(await getCenters())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCenters()
  }, [])

  const filteredCenters = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    if (!keyword) return centers
    return centers.filter((center) =>
      [center.name, center.province, center.address, center.phone]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("vi").includes(keyword)),
    )
  }, [centers, search])

  const handleSaved = (savedCenter) => {
    setCenters((current) => {
      const exists = current.some((center) => center.id === savedCenter.id)
      return exists
        ? current.map((center) => center.id === savedCenter.id ? savedCenter : center)
        : [savedCenter, ...current]
    })
    setDialogOpen(false)
    setEditingCenter(null)
  }

  const handleDelete = async (center) => {
    if (!window.confirm(`Xóa cơ sở "${center.name}"?`)) return
    setDeletingId(center.id)
    setError("")
    try {
      await deleteCenter(center.id)
      setCenters((current) => current.filter((item) => item.id !== center.id))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          
          <h1 className="mt-2 text-3xl font-bold">Cơ sở phòng tập</h1>
          <p className="mt-2 text-sm text-muted-foreground">Quản lý các phòng tập tại nhiều tỉnh, thành phố.</p>
        </div>
        <Button onClick={() => { setEditingCenter(null); setDialogOpen(true) }}>
          Thêm cơ sở
        </Button>
      </div>

      <Card className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="center-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, tỉnh, địa chỉ hoặc số điện thoại..." />
          </div>
          <p className="text-sm text-muted-foreground">{filteredCenters.length} / {centers.length} cơ sở</p>
        </div>
      </Card>

      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <Button variant="outline" onClick={loadCenters}>Thử lại</Button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải danh sách cơ sở...
        </div>
      ) : filteredCenters.length === 0 ? (
        <Card className="flex min-h-64 flex-col items-center justify-center text-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold">{centers.length === 0 ? "Chưa có cơ sở nào" : "Không tìm thấy cơ sở"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {centers.length === 0 ? "Hãy thêm cơ sở đầu tiên để bắt đầu mở lớp." : "Thử tìm bằng từ khóa khác."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCenters.map((center) => (
            <Card key={center.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"><Building2 className="h-5 w-5" /></span>
                <div className="flex gap-1">
                  <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={() => { setEditingCenter(center); setDialogOpen(true) }} aria-label={`Sửa ${center.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50" onClick={() => handleDelete(center)} disabled={deletingId === center.id} aria-label={`Xóa ${center.name}`}>
                    {deletingId === center.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <h2 className="mt-4 text-lg font-bold">{center.name}</h2>
              <p className="mt-1 text-sm font-medium text-primary">{center.province}</p>
              <div className="mt-5 flex-1 space-y-3 text-sm text-muted-foreground">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{center.address}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" />{center.phone || "Chưa cập nhật số điện thoại"}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {dialogOpen && (
        <CenterDialog
          center={editingCenter}
          onClose={() => { setDialogOpen(false); setEditingCenter(null) }}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
