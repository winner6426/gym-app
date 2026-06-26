import { useEffect, useMemo, useState } from "react"
import { Banknote, CheckCircle2, CreditCard, LoaderCircle, ReceiptText, Search, X } from "lucide-react"
import { Button } from "../../components/ui/Button.jsx"
import { Card } from "../../components/ui/Card.jsx"
import { Input } from "../../components/ui/Input.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { enrollRegistration, getPaymentCollections, recordPayment } from "../../services/staffService.js"

const paymentMethods = [
  { value: "CASH", label: "Tiền mặt" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản" },
  { value: "CARD", label: "Thẻ" },
]

const paymentStatusLabels = {
  PENDING: "Chưa thu",
  PARTIALLY_PAID: "Đã thu một phần",
  PAID: "Đã thu đủ",
  REFUNDED: "Đã hoàn tiền",
  CANCELLED: "Đã hủy",
}

const paymentStatusStyles = {
  PENDING: "bg-amber-500/10 text-amber-200",
  PARTIALLY_PAID: "bg-blue-500/10 text-blue-200",
  PAID: "bg-emerald-500/10 text-emerald-200",
  REFUNDED: "bg-violet-500/10 text-violet-200",
  CANCELLED: "bg-zinc-500/10 text-zinc-300",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDateTime(value) {
  if (!value) return "Chưa có"
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function methodLabel(value) {
  return paymentMethods.find((item) => item.value === value)?.label || value || "Chưa có"
}

function PaymentDialog({ payment, staffId, onClose, onSaved }) {
  const [amountReceived, setAmountReceived] = useState(String(payment.remainingAmount || ""))
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [transactionCode, setTransactionCode] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const updated = await recordPayment({
        registrationId: payment.registrationId,
        staffId,
        amountReceived: Number(amountReceived),
        paymentMethod,
        transactionCode: transactionCode.trim(),
      })
      onSaved(updated)
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
            <p className="text-xs font-semibold uppercase text-primary">Xác nhận học phí</p>
            <h2 className="mt-1 text-xl font-bold">{payment.studentName}</h2>
          </div>
          <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-secondary" onClick={onClose} aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5 p-5" onSubmit={submit}>
          <div className="grid gap-3 rounded-lg bg-secondary p-4 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Lớp:</span><br />{payment.classroomCode} - {payment.classroomName}</p>
            <p><span className="text-muted-foreground">Khóa học:</span><br />{payment.courseName}</p>
            <p><span className="text-muted-foreground">Còn phải thu:</span><br />{formatMoney(payment.remainingAmount)}</p>
          </div>

          <Input
            id="amount-received"
            type="number"
            label="Số tiền nhận"
            value={amountReceived}
            onChange={(event) => setAmountReceived(event.target.value)}
            min="1000"
            max={Number(payment.remainingAmount || 0)}
            step="1000"
            autoFocus
          />

          <label className="block" htmlFor="payment-method">
            <span className="mb-2 block text-sm font-semibold">Phương thức thanh toán</span>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </label>

          {paymentMethod !== "CASH" && (
            <Input
              id="transaction-code"
              label="Mã giao dịch"
              value={transactionCode}
              onChange={(event) => setTransactionCode(event.target.value)}
              placeholder="VD: FT242600123"
            />
          )}

          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
              Ghi nhận
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StaffPayments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogPayment, setDialogPayment] = useState(null)
  const [enrollingId, setEnrollingId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      setPayments(await getPaymentCollections())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    if (!keyword) return payments
    return payments.filter((payment) =>
      [
        payment.studentName,
        payment.studentPhone,
        payment.studentEmail,
        payment.classroomCode,
        payment.classroomName,
        payment.courseName,
      ]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("vi").includes(keyword)),
    )
  }, [payments, search])

  const summary = useMemo(() => ({
    total: payments.length,
    waiting: payments.filter((item) => item.paymentStatus !== "PAID").length,
    paid: payments.filter((item) => item.paymentStatus === "PAID").length,
    revenue: payments.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0),
  }), [payments])

  const replacePayment = (updated) => {
    setPayments((current) => current.map((item) => item.registrationId === updated.registrationId ? updated : item))
  }

  const handleSaved = (updated) => {
    replacePayment(updated)
    setDialogPayment(null)
    setSuccess(`Đã ghi nhận học phí cho ${updated.studentName}.`)
  }

  const handleEnroll = async (payment) => {
    setEnrollingId(payment.registrationId)
    setError("")
    setSuccess("")
    try {
      await enrollRegistration(payment.registrationId)
      setPayments((current) => current.filter((item) => item.registrationId !== payment.registrationId))
      setSuccess(`Đã cấp thẻ và xếp lớp cho ${payment.studentName}.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setEnrollingId(null)
    }
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="mt-2 text-3xl font-bold">Xác nhận đóng học phí</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ghi nhận thanh toán của học viên
        </p>
      </div>


      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="payment-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học viên, số điện thoại, mã lớp..." />
          </div>
          <p className="whitespace-nowrap text-sm text-muted-foreground">{filtered.length} khoản thu</p>
        </div>
      </Card>

      {error && <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {success && <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-5 w-5" />{success}</p>}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải khoản thu...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
          Không có khoản học phí cần xử lý.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => {
            const isPaid = payment.paymentStatus === "PAID" && Number(payment.remainingAmount || 0) === 0
            return (
              <Card key={payment.registrationId} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{payment.studentName}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs ${paymentStatusStyles[payment.paymentStatus] || "bg-secondary"}`}>
                      {paymentStatusLabels[payment.paymentStatus] || payment.paymentStatus}
                    </span>
                    <span className="text-xs text-muted-foreground">DK-{String(payment.registrationId).padStart(4, "0")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {payment.classroomCode} - {payment.classroomName} - {payment.centerName}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{payment.studentPhone}</span>
                    <span>Đã thu: {formatMoney(payment.paidAmount)}</span>
                    <span>Còn lại: {formatMoney(payment.remainingAmount)}</span>
                    <span>{methodLabel(payment.paymentMethod)} - {formatDateTime(payment.paymentDate)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {!isPaid && (
                    <Button variant="outline" onClick={() => setDialogPayment(payment)}>
                      <Banknote className="h-4 w-4" />Thu học phí
                    </Button>
                  )}
                  {isPaid && (
                    <Button onClick={() => handleEnroll(payment)} disabled={enrollingId === payment.registrationId}>
                      {enrollingId === payment.registrationId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Cấp thẻ
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {dialogPayment && (
        <PaymentDialog
          payment={dialogPayment}
          staffId={Number(user.id)}
          onClose={() => setDialogPayment(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
