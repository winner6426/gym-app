import { Dumbbell, Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react"

const footerLinks = {
  company: ["Về chúng tôi", "Tuyển dụng", "Tin tức", "Bài viết"],
  services: ["Huấn luyện cá nhân", "Lớp nhóm", "Tư vấn dinh dưỡng", "Sức khỏe doanh nghiệp"],
  support: ["Trung tâm hỗ trợ", "Liên hệ", "Chính sách bảo mật", "Điều khoản dịch vụ"],
}

const socials = [
  { icon: Instagram, label: "Instagram" },
  { icon: Twitter, label: "Twitter" },
  { icon: Facebook, label: "Facebook" },
  { icon: Youtube, label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <a className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Dog2m<span className="text-primary">FITNESS</span>
              </span>
            </a>
            <p className="mb-6 max-w-sm leading-relaxed text-muted-foreground">
              Come my way
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>95a Láng Hạ, Đống Đa, Hà Nội</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-5 w-5 text-primary" />
                <span>0123456789</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-5 w-5 text-primary" />
                <span>thangdeptrai@gmail.com</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="mb-4 font-bold text-foreground capitalize">{group}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a  className="text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
         

          <div className="flex gap-3">
            {socials.map((social) => (
              <a
                key={social.label}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
