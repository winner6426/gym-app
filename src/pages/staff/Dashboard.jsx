import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  LoaderCircle,
  Phone,
  Search,
  UserCheck,
  X,
  XCircle,
} from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import {
  confirmClassCancellation,
  getRecruitingClassroomsForStaff,
  getStaffRegistrations,
  processRegistration,
} from "../../services/staffService.js"

const days = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
}

const statuses = [
  { value: "PENDING_CONFIRMATION", label: "Chờ xác nhận" },
  { value: "WAITING_PAYMENT", label: "Đã xác nhận" },
  { value: "CANCELLATION_REQUESTED", label: "Yêu cầu hủy lớp" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "CANCELLED", label: "Đã hủy" },
]

const statusStyles = {
  PENDING_CONFIRMATION: "bg-amber-500/10 text-amber-200",
  WAITING_PAYMENT: "bg-violet-500/10 text-violet-200",
  PAID: "bg-emerald-500/10 text-emerald-200",
  ENROLLED: "bg-emerald-500/10 text-emerald-200",
  CANCELLATION_REQUESTED: "bg-amber-500/10 text-amber-200",
  REJECTED: "bg-red-500/10 text-red-200",
  CANCELLED: "bg-zinc-500/10 text-zinc-300",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function getStatusLabel(status) {
  if (status === "CONTACTED") return "Đã xác nhận"
  return statuses.find((item) => item.value === status)?.label || status
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`))
    : "-"
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function getRefundPercent(item) {
  if (item.refundPercent !== undefined && item.refundPercent !== null) {
    return Number(item.refundPercent)
  }

  const totalSession = Number(item.session || 0)
  const remainingSession = Number(item.remainingSession || 0)
  const usedSession = Math.max(totalSession - remainingSession, 0)

  if (totalSession === 0 || remainingSession === totalSession) return 100
  if (usedSession * 2 <= totalSession) return 50
  return 0
}

function getRefundAmount(item) {
  if (item.refundAmount !== undefined && item.refundAmount !== null) {
    return Number(item.refundAmount)
  }

  return Number(item.paidAmount || 0) * getRefundPercent(item) / 100
}

function formatAvailabilities(availabilities = []) {
  if (!availabilities.length) return "Chưa khai báo"
  return availabilities
    .map((item) => `${days[item.dayOfWeek] || item.dayOfWeek} ${item.startTime?.slice(0, 5)}-${item.endTime?.slice(0, 5)}`)
    .join(", ")
}

function ProcessDialog({ registration, classrooms, onClose, onProcessed }) {
  const [classroomId, setClassroomId] = useState(String(registration.classroomId))
  const [staffNote, setStaffNote] = useState(registration.staffNote || "")
  const [saving, setSaving] = useState("")
  const [error, setError] = useState("")

  const submit = async (status) => {
    setSaving(status)
    setError("")
    try {
      const updated = await processRegistration(registration.id, {
        status,
        classroomId: Number(classroomId),
        staffNote: staffNote.trim(),
      })
      onProcessed(updated)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving("")
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Xác nhận đăng ký</p>
            <h2 className="mt-1 text-xl font-bold">{registration.studentName}</h2>
          </div>
          <button className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-3 rounded-lg bg-secondary p-4 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Điện thoại:</span><br />{registration.studentPhone}</p>
            <p><span className="text-muted-foreground">Email:</span><br />{registration.studentEmail}</p>
            <p><span className="text-muted-foreground">Lớp mong muốn:</span><br />{registration.classroomCode} - {registration.classroomName}</p>
            <p><span className="text-muted-foreground">Buổi có thể học:</span><br />{formatAvailabilities(registration.availabilities)}</p>
          </div>

          {registration.memberNote && (
            <p className="rounded-md border border-border px-4 py-3 text-sm">
              <span className="font-semibold">Ghi chú học viên:</span> {registration.memberNote}
            </p>
          )}

          <label className="block" htmlFor="confirmed-classroom">
            <span className="mb-2 block text-sm font-semibold">Lớp xác nhận</span>
            <select
              id="confirmed-classroom"
              value={classroomId}
              onChange={(event) => setClassroomId(event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
            >
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.code} - {classroom.name} - {classroom.centerName}
                </option>
              ))}
            </select>
          </label>

          <label className="block" htmlFor="staff-note">
            <span className="mb-2 block text-sm font-semibold">Ghi chú xử lý</span>
            <textarea
              id="staff-note"
              value={staffNote}
              onChange={(event) => setStaffNote(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Kết quả cuộc gọi, khung giờ đã thống nhất..."
            />
          </label>

          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => submit("REJECTED")} disabled={Boolean(saving)}>
              {saving === "REJECTED" ? "Đang xử lý..." : "Từ chối"}
            </Button>
            <Button onClick={() => submit("WAITING_PAYMENT")} disabled={Boolean(saving)}>
              {saving === "WAITING_PAYMENT" ? "Đang xử lý..." : "Xác nhận, mời đóng phí"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RefundDialog({ registration, staffId, onClose, onProcessed }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const refundPercent = getRefundPercent(registration)
  const refundAmount = getRefundAmount(registration)

  const submit = async () => {
    setSaving(true)
    setError("")
    try {
      const updated = await confirmClassCancellation(registration.id, staffId)
      onProcessed(updated)
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
            <p className="text-xs font-semibold uppercase text-primary">Xác nhận hủy lớp</p>
            <h2 className="mt-1 text-xl font-bold">{registration.studentName}</h2>
          </div>
          <button className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          <div className="grid gap-3 rounded-lg bg-secondary p-4 sm:grid-cols-2">
            <p><span className="text-muted-foreground">Điện thoại:</span><br />{registration.studentPhone}</p>
            <p><span className="text-muted-foreground">Lớp:</span><br />{registration.classroomCode} - {registration.classroomName}</p>
            <p><span className="text-muted-foreground">Số buổi:</span><br />Còn {registration.remainingSession || 0}/{registration.session || 0} buổi</p>
            <p><span className="text-muted-foreground">Tiền hoàn:</span><br />{formatCurrency(refundAmount)} ({refundPercent}%)</p>
          </div>

          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100">
            Chỉ xác nhận sau khi đã gọi điện cho học viên. Hệ thống sẽ hủy lớp, hủy thẻ và cập nhật trạng thái thanh toán hoàn tiền.
          </p>

          {registration.refundPolicyMessage && (
            <p className="rounded-md border border-border px-4 py-3">{registration.refundPolicyMessage}</p>
          )}
          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={saving}>Đóng</Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Đang xác nhận..." : "Đã gọi và xác nhận hoàn tiền"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("PENDING_CONFIRMATION")
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [refundRegistration, setRefundRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [registrationData, classroomData] = await Promise.all([
        getStaffRegistrations(),
        getRecruitingClassroomsForStaff(),
      ])
      setRegistrations(registrationData)
      setClassrooms(classroomData)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    return registrations.filter((registration) =>
      (statusFilter === "ALL" || registration.status === statusFilter)
      && (!keyword || [
        registration.studentName,
        registration.studentPhone,
        registration.studentEmail,
        registration.classroomCode,
        registration.courseName,
      ].filter(Boolean).some((value) => value.toLocaleLowerCase("vi").includes(keyword))),
    )
  }, [registrations, search, statusFilter])

  const handleProcessed = (updated) => {
    setRegistrations((current) =>
      updated.status === "CANCELLED"
        ? current.filter((item) => item.id !== updated.id)
        : current.map((item) => item.id === updated.id ? updated : item),
    )
    setSelectedRegistration(null)
    setRefundRegistration(null)
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="mt-2 text-3xl font-bold">Xác nhận đăng ký học</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kiểm tra thông tin học viên, xác nhận đăng ký, từ chối hồ sơ hoặc xử lý yêu cầu hủy lớp.
        </p>
      </div>

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="registration-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học viên, điện thoại, mã lớp..." />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none">
            <option value="ALL">Tất cả trạng thái</option>
            {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
          <p className="whitespace-nowrap text-sm text-muted-foreground">{filtered.length} đăng ký</p>
        </div>
      </Card>

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <Button variant="outline" onClick={loadData}>Thử lại</Button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải đăng ký...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
          Không có đăng ký phù hợp.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((registration) => (
            <Card key={registration.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{registration.studentName}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${statusStyles[registration.status] || "bg-secondary"}`}>{getStatusLabel(registration.status)}</span>
                  <span className="text-xs text-muted-foreground">DK-{String(registration.id).padStart(4, "0")}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {registration.classroomCode} - {registration.classroomName} - {registration.centerName}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">{registration.studentPhone}</span>
                  <span>Buổi phù hợp: {formatAvailabilities(registration.availabilities)}</span>
                  <span>Gửi: {formatDate(registration.registrationDate)}</span>
                </p>
                {registration.status === "CANCELLATION_REQUESTED" && (
                  <p className="mt-2 text-xs text-amber-100">
                    Hoàn dự kiến {formatCurrency(getRefundAmount(registration))} ({getRefundPercent(registration)}%) - còn {registration.remainingSession}/{registration.session} buổi
                  </p>
                )}
              </div>
              {["PENDING_CONFIRMATION", "CONTACTED"].includes(registration.status) && (
                <Button variant="outline" onClick={() => setSelectedRegistration(registration)}>
                  <UserCheck className="h-4 w-4" />Xử lý
                </Button>
              )}
              {registration.status === "CANCELLATION_REQUESTED" && (
                <Button variant="outline" onClick={() => setRefundRegistration(registration)}>
                  <UserCheck className="h-4 w-4" />Xác nhận hoàn tiền
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {selectedRegistration && (
        <ProcessDialog
          registration={selectedRegistration}
          classrooms={classrooms}
          onClose={() => setSelectedRegistration(null)}
          onProcessed={handleProcessed}
        />
      )}
      {refundRegistration && (
        <RefundDialog
          registration={refundRegistration}
          staffId={user.id}
          onClose={() => setRefundRegistration(null)}
          onProcessed={handleProcessed}
        />
      )}
    </>
  )
}
