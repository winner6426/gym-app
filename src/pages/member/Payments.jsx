import { FileText, LoaderCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Card } from "../../components/ui/Card.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { getMyPayments } from "../../services/memberService.js"

const statusLabels = {
  PENDING: "Chưa thu",
  PARTIALLY_PAID: "Thu một phần",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn",
  CANCELLED: "Đã hủy",
}

const statusStyles = {
  PENDING: "bg-amber-500/10 text-amber-200",
  PARTIALLY_PAID: "bg-blue-500/10 text-blue-200",
  PAID: "bg-emerald-500/10 text-emerald-300",
  REFUNDED: "bg-violet-500/10 text-violet-200",
  CANCELLED: "bg-zinc-500/10 text-zinc-300",
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Đã có lỗi xảy ra."
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return "Chưa có"
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value))
}

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadPayments() {
      setLoading(true)
      setError("")
      try {
        const data = await getMyPayments(user.id)
        setPayments(data)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [user.id])

  const summary = useMemo(() => {
    const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0)
    const discountAmount = payments.reduce((sum, payment) => sum + Number(payment.discountAmount || 0), 0)
    const debtAmount = payments.reduce((sum, payment) => sum + Number(payment.remainingAmount || 0), 0)
    return { paidAmount, discountAmount, debtAmount }
  }, [payments])

  return (
    <>
      <div className="mb-7">
        
        <h1 className="mt-2 text-3xl font-bold">Học phí</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tra cứu lịch sử thanh toán, ưu đãi và biên nhận.
        </p>
      </div>

      {error && <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-muted-foreground">Tổng đã thanh toán</p><p className="mt-3 text-2xl font-bold">{formatCurrency(summary.paidAmount)}</p></Card>
        
        <Card><p className="text-sm text-muted-foreground">Công nợ hiện tại</p><p className="mt-3 text-2xl font-bold">{formatCurrency(summary.debtAmount)}</p></Card>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải học phí...
        </div>
      ) : payments.length === 0 ? (
        <Card className="mt-6 flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Bạn chưa có biên nhận học phí nào.
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-4">Biên nhận</th>
                <th className="px-5 py-4">Khóa học</th>
                <th className="px-5 py-4">Ngày thu</th>
                <th className="px-5 py-4">Đã thu</th>
                <th className="px-5 py-4">Còn lại</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.paymentId} className="border-t border-border bg-card">
                  <td className="px-5 py-4 font-semibold">HP-{String(payment.paymentId).padStart(6, "0")}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{payment.courseName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{payment.classroomCode} - {payment.classroomName}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDate(payment.paymentDate)}</td>
                  <td className="px-5 py-4 font-semibold">{formatCurrency(payment.paidAmount)}</td>
                  <td className="px-5 py-4 font-semibold">{formatCurrency(payment.remainingAmount)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-2 py-1 text-xs ${statusStyles[payment.paymentStatus] || "bg-secondary"}`}>
                      {statusLabels[payment.paymentStatus] || payment.paymentStatus}
                    </span>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card className="mt-6 border-primary/30 bg-primary/10">
        <p className="font-semibold">Ưu đãi khóa tiếp theo</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Từ khóa thứ hai, học viên được giảm 10%. Trình độ tiếp theo do huấn luyện viên đánh giá và đề xuất.
        </p>
      </Card>
    </>
  )
}
