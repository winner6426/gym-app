import { ArrowRight, Play } from "lucide-react"
import { Button } from "../ui/Button.jsx"
import { Link } from "react-router-dom"
import heroGym from "../../assets/images/hero-gym.jpg"


export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroGym} alt="Phòng tập hiện đại" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-32 sm:px-6 md:py-40 lg:px-8">
        <div className="max-w-3xl">
          
          <h1 className="mb-6 text-4xl leading-tight font-bold text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            <span>Thay đổi bản thân</span>
            <br />
            <span className="text-primary">Nâng cao cuộc sống</span>
          </h1>

          <p className="mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Hệ thống phòng tập hiện đại, lớp học đa trình độ và huấn luyện viên đồng hành giúp bạn tập luyện hiệu quả hơn mỗi ngày.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link to="/register" >
              <Button size="lg">
                Bắt đầu đăng ký
              </Button>
            </Link>
            
          </div>

          
        </div>
      </div>
    </section>
  )
}
