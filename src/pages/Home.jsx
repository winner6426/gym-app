import { Footer } from "../components/layout/Footer.jsx"
import { Navigation } from "../components/layout/Navigation.jsx"
import { Hero } from "../components/home/Hero.jsx"
import { RecruitingClasses } from "../components/home/RecruitingClasses.jsx"
import { Services } from "../components/home/Services.jsx"
import { Testimonials } from "../components/home/Testimonials.jsx"
import { Trainers } from "../components/home/Trainers.jsx"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <Services />
      <RecruitingClasses />
      <Trainers />
      <Testimonials />
      <Footer />
    </main>
  )
}
