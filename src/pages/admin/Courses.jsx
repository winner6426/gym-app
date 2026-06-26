import { useEffect, useMemo, useState } from "react"
import {
  BookOpenCheck,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import {
  createCourse,
  getCourses,
  setCourseActive,
  updateCourse,
} from "../../services/adminService.js"

const levels = [
  { value: "BASIC", label: "Cơ bản" },
  { value: "ADVANCED", label: "Nâng cao" },
  { value: "PROFESSIONAL", label: "Chuyên nghiệp" },
]

const emptyForm = {
  name: "",
  description: "",
  session: "",
  level: "BASIC",
  price: "",
}

function getLevelLabel(level) {
  return levels.find((item) => item.value === level)?.label || level
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function CourseDialog({ course, onClose, onSaved }) {
  const [form, setForm] = useState(course ? {
    name: course.name || "",
    description: course.description || "",
    session: String(course.session ?? ""),
    level: course.level || "BASIC",
    price: String(course.price ?? ""),
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

    const session = Number(form.session)
    const price = Number(form.price)

    if (!form.name.trim()) {
      setError("Tên khóa học không được để trống.")
      return
    }
    if (!Number.isInteger(session) || session <= 0) {
      setError("Số buổi học phải là số nguyên lớn hơn 0.")
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Học phí phải lớn hơn 0.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        session,
        level: form.level,
        price,
      }
      const saved = course
        ? await updateCourse(course.id, payload)
        : await createCourse(payload)
      onSaved(saved)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            
            <h2 className="mt-1 text-xl font-bold">
              {course ? "Cập nhật khóa học" : "Tạo khóa học mới"}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4 p-5" onSubmit={handleSubmit}>
          <Input
            id="course-name"
            name="name"
            label="Tên khóa học"
            value={form.name}
            onChange={handleChange}
            placeholder="Ví dụ: Fitness cơ bản"
            autoFocus
          />

          <label className="block" htmlFor="course-description">
            <span className="mb-2 block text-sm font-semibold">Mô tả</span>
            <textarea
              id="course-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Mô tả đối tượng, nội dung và mục tiêu khóa học..."
              className="w-full resize-y rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block" htmlFor="course-level">
              <span className="mb-2 block text-sm font-semibold">Trình độ</span>
              <select
                id="course-level"
                name="level"
                value={form.level}
                onChange={handleChange}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {levels.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </label>

            <Input
              id="course-session"
              name="session"
              type="number"
              min="1"
              step="1"
              label="Số buổi"
              value={form.session}
              onChange={handleChange}
              placeholder="Ví dụ: 24"
            />
          </div>

          <Input
            id="course-price"
            name="price"
            type="number"
            min="1000"
            step="1000"
            label="Học phí (VNĐ)"
            value={form.price}
            onChange={handleChange}
            placeholder="Ví dụ: 3000000"
          />

          {error && (
            <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {course ? "Lưu thay đổi" : "Tạo khóa học"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [changingId, setChangingId] = useState(null)

  const loadCourses = async () => {
    setLoading(true)
    setError("")
    try {
      setCourses(await getCourses())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")

    return courses.filter((course) => {
      const matchesKeyword = !keyword
        || [course.name, course.description]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase("vi").includes(keyword))
      const matchesLevel = levelFilter === "ALL" || course.level === levelFilter
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "ACTIVE" ? course.active : !course.active)

      return matchesKeyword && matchesLevel && matchesStatus
    })
  }, [courses, search, levelFilter, statusFilter])

  const handleSaved = (savedCourse) => {
    setCourses((current) => {
      const exists = current.some((course) => course.id === savedCourse.id)
      return exists
        ? current.map((course) => course.id === savedCourse.id ? savedCourse : course)
        : [savedCourse, ...current]
    })
    setDialogOpen(false)
    setEditingCourse(null)
  }

  const handleToggleActive = async (course) => {
    const nextActive = !course.active
    const action = nextActive ? "mở lại" : "tạm ngừng"
    if (!window.confirm(`Bạn muốn ${action} khóa học "${course.name}"?`)) return

    setChangingId(course.id)
    setError("")
    try {
      const updated = await setCourseActive(course.id, nextActive)
      setCourses((current) =>
        current.map((item) => item.id === updated.id ? updated : item),
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setChangingId(null)
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          
          <h1 className="mt-2 text-3xl font-bold">Khóa học</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý trình độ, số buổi và học phí trước khi mở lớp thực tế.
          </p>
        </div>
        <Button onClick={() => { setEditingCourse(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />Tạo khóa học
        </Button>
      </div>

      <Card className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="course-search"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên hoặc mô tả..."
            />
          </div>
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="ALL">Tất cả trình độ</option>
            {levels.map((level) => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm ngừng</option>
          </select>
          <p className="whitespace-nowrap text-sm text-muted-foreground">
            {filteredCourses.length} / {courses.length} khóa học
          </p>
        </div>
      </Card>

      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <Button variant="outline" onClick={loadCourses}>Thử lại</Button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải danh sách khóa học...
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="flex min-h-64 flex-col items-center justify-center text-center">
          <BookOpenCheck className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold">
            {courses.length === 0 ? "Chưa có khóa học nào" : "Không tìm thấy khóa học"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {courses.length === 0
              ? "Tạo khóa học đầu tiên trước khi mở lớp."
              : "Hãy thử thay đổi từ khóa hoặc bộ lọc."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className={`flex flex-col ${course.active ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                    {getLevelLabel(course.level)}
                  </span>
                  <h2 className="mt-3 text-lg font-bold">{course.name}</h2>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  course.active
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-zinc-500/15 text-zinc-300"
                }`}>
                  {course.active ? "Đang hoạt động" : "Tạm ngừng"}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 min-h-15 text-sm leading-6 text-muted-foreground">
                {course.description || "Chưa có mô tả cho khóa học này."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-4 w-4 text-primary" />Thời lượng
                  </p>
                  <p className="mt-2 font-bold">{course.session} buổi</p>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CircleDollarSign className="h-4 w-4 text-primary" />Học phí
                  </p>
                  <p className="mt-2 font-bold">{formatCurrency(course.price)}</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setEditingCourse(course); setDialogOpen(true) }}
                >
                  <Pencil className="h-4 w-4" />Chỉnh sửa
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleToggleActive(course)}
                  disabled={changingId === course.id}
                >
                  {changingId === course.id
                    ? <LoaderCircle className="h-4 w-4 animate-spin" />
                    : course.active
                      ? <ToggleRight className="h-4 w-4" />
                      : <ToggleLeft className="h-4 w-4" />}
                  {course.active ? "Tạm ngừng" : "Mở lại"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {dialogOpen && (
        <CourseDialog
          course={editingCourse}
          onClose={() => { setDialogOpen(false); setEditingCourse(null) }}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
