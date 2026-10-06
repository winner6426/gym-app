import { Mail, Phone, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { getPublicTrainers } from "../../services/homeService.js"

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Không tải được danh sách huấn luyện viên."
}

export function Trainers() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTrainers() {
      setLoading(true)
      setError("")
      try {
        const data = await getPublicTrainers()
        setTrainers(data)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    loadTrainers()
  }, [])

  return (
    <section id="trainers" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="text-xl font-semibold tracking-wider text-primary uppercase">Huấn luyện viên</span>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Các huấn luyện viên có nhiều năm kinh nghiệm.
          </p>
        </div>

        {error && <p className="mb-8 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        {loading ? (
          <div className="grid gap-8 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : trainers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            Chưa có huấn luyện viên đang hoạt động trong hệ thống.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                className="rounded-2xl border border-border bg-card p-8 text-center"
              >
                <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                  <UserRound className="h-16 w-16 text-primary" />
                </div>

                <h3 className="text-xl font-bold text-foreground">{trainer.name || "Huấn luyện viên"}</h3>
                <p className="mb-5 mt-1 text-sm font-medium text-primary">Huấn luyện viên trung tâm</p>
                <div className="space-y-3 text-left text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-primary" />
                    Mã HLV #{trainer.id}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    {trainer.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    {trainer.phoneNumber || "Chưa có số điện thoại"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
