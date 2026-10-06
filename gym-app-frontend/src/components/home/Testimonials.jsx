import { Quote, Star } from "lucide-react"

const testimonials = [
  {
    name: "Phạm Anh Nam",
    role: "Giảm 18kg trong 6 tháng",
    content:
      "Dog2mFITNESS đã giúp tôi thay đổi lối sống sinh hoạt, cơ thể và giúp tôi tự tin hơn",
    rating: 5,
  },
  {
    name: "Trần Văn Thắng",
    role: "IFBB Pro Raumanian",
    content:
      "Các thiết bị ở đây rất tốt và đa dạng, phù hợp cho chương trình tập luyện của tôi",
    rating: 5,
  },
  {
    name: "Trần Minh Đức",
    role: "Sinh viên HUST",
    content:
      "Lịch học linh hoạt rất phù hợp với công việc của tôi. Mặc dù tôi rất lười.",
    rating: 5,
  },
  {
    name: "Lê Tiến Thịnh",
    role: "Cầu thủ bóng rổ",
    content:
      "Tôi đã tập ở nhiều nơi, nhưng ở đây cho tôi cảm giác như ở nhà",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-secondary/30 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="text-xl font-semibold tracking-wider text-primary uppercase">Đánh giá</span>
          <p className="mx-auto mt-4  text-lg leading-relaxed text-muted-foreground">
            Lắng nghe chia sẻ từ những học viên đã thay đổi tích cực và đạt được mục tiêu tập luyện.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30"
            >
              <Quote className="mb-4 h-10 w-10 text-primary/30" />
                <p className="mb-6 text-lg leading-relaxed text-foreground">{testimonial.content}</p>
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <Star key={index} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <div>
                <div className="font-bold text-foreground">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
