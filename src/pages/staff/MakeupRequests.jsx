import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock3, LoaderCircle, Search, XCircle } from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { getStaffMakeupRequests, processMakeupRequest } from "../../services/staffService.js"

const statusOptions = [
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "COMPLETED", label: "Đã học bù" },
]

const statusStyles = {
  PENDING: "bg-amber-500/10 text-amber-200",
  APPROVED: "bg-blue-500/10 text-blue-200",
  REJECTED: "bg-red-500/10 text-red-200",
  COMPLETED: "bg-emerald-500/10 text-emerald-200",
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

export default function MakeupRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState("PENDING")
  const [search, setSearch] = useState("")
  const [processingId, setProcessingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getStaffMakeupRequests(statusFilter === "ALL" ? undefined : statusFilter)
      setRequests(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [statusFilter])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    if (!keyword) return requests
    return requests.filter((request) =>
      [request.sourceClassroomName, request.targetClassroomName, request.targetCenterName, request.targetProvince]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("vi").includes(keyword)),
    )
  }, [requests, search])

  const counts = useMemo(() => Object.fromEntries(
    statusOptions.map((status) => [
      status.value,
      requests.filter((item) => item.status === status.value).length,
    ]),
  ), [requests])

  const handleProcess = async (request, status) => {
    setProcessingId(request.id)
    setError("")
    setSuccess("")
    try {
      const updated = await processMakeupRequest(request.id, {
        staffId: Number(user.id),
        status,
        staffNote: status === "REJECTED" ? "Không đủ điều kiện học bù." : "Đã xác nhận yêu cầu học bù.",
      })
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item))
      setSuccess(`Đã cập nhật yêu cầu HB-${updated.id}.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <>
      <div className="mb-7">
        
        <h1 className="mt-2 text-3xl font-bold">Duyệt yêu cầu học bù</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Xác nhận học viên báo nghỉ hợp lệ và cho phép học bù ở lớp phù hợp.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusOptions.map((status) => (
          <Card key={status.value}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{status.label}</p>
           
            </div>
            <p className="mt-4 text-3xl font-bold">{counts[status.value] || 0}</p>
          </Card>
        ))}
      </div>

      {error && <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {success && <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-5 w-5" />{success}</p>}

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="makeup-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm lớp, cơ sở, tỉnh..." />
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
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải yêu cầu học bù...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
          Không có yêu cầu học bù phù hợp.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <Card key={request.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">HB-{request.id} - {request.targetClassroomName}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${statusStyles[request.status] || "bg-secondary"}`}>{getStatusLabel(request.status)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nghỉ ngày {formatDate(request.absenceDate)} - từ {request.sourceClassroomName} sang {request.targetClassroomName}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Học bù tại {request.targetCenterName}, {request.targetProvince} - Lý do: {request.reason}
                </p>
              </div>
              {request.status === "PENDING" && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" disabled={processingId === request.id} onClick={() => handleProcess(request, "REJECTED")}>
                    {processingId === request.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Từ chối
                  </Button>
                  <Button disabled={processingId === request.id} onClick={() => handleProcess(request, "APPROVED")}>
                    {processingId === request.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Duyệt
                  </Button>
                </div>
              )}
              {request.status === "APPROVED" && (
                <Button variant="outline" disabled={processingId === request.id} onClick={() => handleProcess(request, "COMPLETED")}>
                  {processingId === request.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Đã học bù
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
