import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Eye, LoaderCircle, PauseCircle, Search, X, XCircle } from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { getStaffFreezeRequests, processFreezeRequest } from "../../services/staffService.js"

const statusOptions = [
  { value: "PENDING", label: "Chờ duyệt bảo lưu" },
  { value: "FROZEN", label: "Đang bảo lưu" },
]

const statusStyles = {
  PENDING: "bg-amber-500/10 text-amber-200",
  FROZEN: "bg-blue-500/10 text-blue-200",
  REJECTED: "bg-red-500/10 text-red-200",
  RESUMED: "bg-emerald-500/10 text-emerald-200",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`)) : "Chưa có"
}

function getStatusLabel(status) {
  return statusOptions.find((item) => item.value === status)?.label || status
}

function DetailRow({ label, children }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span>
      <br />
      {children || "Chưa có"}
    </p>
  )
}

function RequestDialog({ request, staffId, onClose, onProcessed }) {
  const [staffNote, setStaffNote] = useState(request.staffNote || "")
  const [savingAction, setSavingAction] = useState("")
  const [error, setError] = useState("")
  const canProcessFreeze = request.status === "PENDING"

  const submit = async (nextStatus) => {
    setSavingAction(nextStatus)
    setError("")
    try {
      const updated = await processFreezeRequest(request.id, {
        staffId,
        status: nextStatus,
        staffNote: staffNote.trim(),
      })
      onProcessed(updated)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSavingAction("")
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Chi tiết yêu cầu</p>
            <h2 className="mt-1 text-xl font-bold">BL-{request.id} - {request.studentName}</h2>
          </div>
          <button className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="space-y-5 p-5">
          

          <div className="grid gap-3 rounded-lg bg-secondary p-4 text-sm sm:grid-cols-2">
            <DetailRow label="Điện thoại">{request.studentPhone}</DetailRow>
            <DetailRow label="Email">{request.studentEmail}</DetailRow>
            <DetailRow label="Lớp đang bảo lưu">{request.classroomCode} - {request.classroomName}</DetailRow>
            <DetailRow label="Khóa học">{request.courseName}</DetailRow>
            <DetailRow label="Còn lại">{request.remainingSession} buổi</DetailRow>
            <DetailRow label="Cơ sở">{request.centerName}, {request.province}</DetailRow>
            <DetailRow label="Thời gian bảo lưu">{formatDate(request.startDate)} đến {formatDate(request.endDate)}</DetailRow>
            <DetailRow label="Trình độ">{request.level}</DetailRow>
          </div>

          <p className="rounded-md border border-border px-4 py-3 text-sm">
            <span className="font-semibold">Lý do học viên:</span> {request.reason || "Chưa có"}
          </p>

          <label className="block" htmlFor="staff-note">
            <span className="mb-2 block text-sm font-semibold">Ghi chú xử lý</span>
            <textarea
              id="staff-note"
              value={staffNote}
              onChange={(event) => setStaffNote(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Nhập ghi chú trước khi duyệt hoặc từ chối..."
              disabled={!canProcessFreeze}
            />
          </label>

          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={Boolean(savingAction)}>Đóng</Button>

            {canProcessFreeze && (
              <>
                <Button variant="outline" onClick={() => submit("REJECTED")} disabled={Boolean(savingAction)}>
                  {savingAction === "REJECTED" ? "Đang xử lý..." : "Từ chối bảo lưu"}
                </Button>
                <Button onClick={() => submit("FROZEN")} disabled={Boolean(savingAction)}>
                  {savingAction === "FROZEN" ? "Đang xử lý..." : "Duyệt bảo lưu"}
                </Button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default function FreezeRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogRequest, setDialogRequest] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getStaffFreezeRequests(statusFilter === "ALL" ? undefined : statusFilter)
      setRequests(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [statusFilter])

  const counts = useMemo(() => Object.fromEntries(
    statusOptions.map((status) => [
      status.value,
      requests.filter((item) => item.status === status.value).length,
    ]),
  ), [requests])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    const source = requests.filter((request) =>
      request.status === "PENDING" || request.status === "FROZEN",
    )
    if (!keyword) return source
    return source.filter((request) =>
      [
        request.studentName,
        request.studentPhone,
        request.studentEmail,
        request.classroomCode,
        request.courseName,
        request.targetClassroomCode,
        request.targetClassroomName,
      ]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("vi").includes(keyword)),
    )
  }, [requests, search])

  const handleProcessed = (updated) => {
    setRequests((current) => {
      if (updated.status !== "PENDING" && updated.status !== "FROZEN") {
        return current.filter((item) => item.id !== updated.id)
      }
      return current.map((item) => item.id === updated.id ? updated : item)
    })
    setDialogRequest(null)
    setSuccess(`Đã xử lý yêu cầu BL-${updated.id}.`)
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="mt-2 text-3xl font-bold">
          Duyệt bảo lưu
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Xác nhận yêu cầu bảo lưu
        </p>
      </div>

      

      {error && <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {success && <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-5 w-5" />{success}</p>}

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_240px_auto] sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="freeze-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học viên, điện thoại, mã lớp..." />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none">
            <option value="ALL">Tất cả trạng thái</option>
            {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
          <p className="whitespace-nowrap text-sm text-muted-foreground">{filtered.length} yêu cầu</p>
        </div>
      </Card>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải yêu cầu...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
          Không có yêu cầu phù hợp.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => setDialogRequest(request)}
              className="block w-full rounded-lg text-left outline-none focus:ring-2 focus:ring-primary/30"
            >
              <Card className="flex flex-col gap-4 transition-colors hover:border-primary/40 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">BL-{request.id} - {request.studentName}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs ${statusStyles[request.status] || "bg-secondary"}`}>{getStatusLabel(request.status)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.classroomCode} - {request.classroomName} - còn {request.remainingSession} buổi
                  </p>
                  {request.status === "RESUMED" && (
                    <p className="mt-1 text-sm text-primary">
                      Đã học lại: {request.targetClassroomCode} - {request.targetClassroomName}, ngày {formatDate(request.resumeDate)}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(request.startDate)} đến {formatDate(request.endDate)} - {request.studentPhone}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <Eye className="h-4 w-4" />Chi tiết
                </span>
              </Card>
            </button>
          ))}
        </div>
      )}

      {dialogRequest && (
        <RequestDialog
          request={dialogRequest}
          staffId={Number(user.id)}
          onClose={() => setDialogRequest(null)}
          onProcessed={handleProcessed}
        />
      )}
    </>
  )
}
