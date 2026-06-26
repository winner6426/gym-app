import { useEffect, useMemo, useState } from "react"
import { LoaderCircle, Phone, Search, Trash2, X } from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { confirmClassCancellation, getStaffRegistrations } from "../../services/staffService.js"

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
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

function ConfirmDialog({ request, staffId, onClose, onConfirmed }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const refundPercent = getRefundPercent(request)
  const refundAmount = getRefundAmount(request)

  const submit = async () => {
    setSaving(true)
    setError("")
    try {
      const updated = await confirmClassCancellation(request.id, staffId)
      onConfirmed(updated)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-xl rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Xác nhận hủy lớp</p>
            <h2 className="mt-1 text-xl font-bold">{request.studentName}</h2>
          </div>
          <button type="button" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          <div className="grid gap-3 rounded-md border border-border bg-secondary p-4 sm:grid-cols-2">
            <p><span className="text-muted-foreground">Điện thoại:</span><br />{request.studentPhone}</p>
            <p><span className="text-muted-foreground">Lớp:</span><br />{request.classroomCode} - {request.classroomName}</p>
            <p><span className="text-muted-foreground">Số buổi:</span><br />Còn {request.remainingSession || 0}/{request.session || 0} buổi</p>
            <p><span className="text-muted-foreground">Tiền hoàn:</span><br />{formatCurrency(refundAmount)} ({refundPercent}%)</p>
          </div>

          <p className="rounded-md border px-4 py-3 text-amber-100">
            Chỉ xác nhận sau khi đã gọi điện cho học viên. Sau khi xác nhận, lớp sẽ bị hủy khỏi danh sách lớp của học viên và trạng thái hoàn tiền sẽ được cập nhật.
          </p>

          {request.refundPolicyMessage && (
            <p className="rounded-md border border-border px-4 py-3">{request.refundPolicyMessage}</p>
          )}
          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Đóng</Button>
            <Button type="button" onClick={submit} disabled={saving}>
              {saving ? "Đang xác nhận..." : "Đã gọi và xác nhận hủy lớp"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClassCancellationRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRequest, setSelectedRequest] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      setRequests(await getStaffRegistrations("CANCELLATION_REQUESTED"))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    if (!keyword) return requests

    return requests.filter((request) =>
      [
        request.studentName,
        request.studentPhone,
        request.studentEmail,
        request.classroomCode,
        request.classroomName,
        request.centerName,
      ].filter(Boolean).some((value) => value.toLocaleLowerCase("vi").includes(keyword)),
    )
  }, [requests, search])

  const handleConfirmed = (updated) => {
    setRequests((current) => current.filter((request) => request.id !== updated.id))
    setSelectedRequest(null)
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="mt-2 text-3xl font-bold">Duyệt hủy lớp</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gọi điện xác nhận yêu cầu hủy lớp của học viên và xử lý hoàn tiền theo quy định.
        </p>
      </div>

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="class-cancel-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học viên, điện thoại, mã lớp..." />
          </div>
          <p className="whitespace-nowrap text-sm text-muted-foreground">{filteredRequests.length} yêu cầu</p>
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
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải yêu cầu hủy lớp...
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
          Không có yêu cầu hủy lớp đang chờ xử lý.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const refundPercent = getRefundPercent(request)
            const refundAmount = getRefundAmount(request)

            return (
              <Card key={request.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{request.studentName}</p>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">Chờ xác nhận hủy</span>
                    <span className="text-xs text-muted-foreground">DK-{String(request.id).padStart(4, "0")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.classroomCode} - {request.classroomName} - {request.centerName}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary" />{request.studentPhone}</span>
                    <span>Còn {request.remainingSession}/{request.session} buổi</span>
                    <span>Hoàn {formatCurrency(refundAmount)} ({refundPercent}%)</span>
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSelectedRequest(request)}>
                  <Trash2 className="h-4 w-4" />Xác nhận hủy lớp
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {selectedRequest && (
        <ConfirmDialog
          request={selectedRequest}
          staffId={user.id}
          onClose={() => setSelectedRequest(null)}
          onConfirmed={handleConfirmed}
        />
      )}
    </>
  )
}
