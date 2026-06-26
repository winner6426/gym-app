import boxingImage from "../../assets/images/boxing.jpg"
import calisthenicImage from "../../assets/images/calisthenic.jpg"
import cardioImage from "../../assets/images/cardio.jpg"
import gymImage from "../../assets/images/gym.jpg"
import yogaImage from "../../assets/images/yoga.jpg"

const services = [
  { title: "GYM", image: gymImage },
  { title: "YOGA", image: yogaImage },
  { title: "CALISTHENIC", image: calisthenicImage },
  { title: "CARDIO", image: cardioImage },
  { title: "BOXING", image: boxingImage },
]

export function Services() {
  return (
    <section id="services" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-xl font-semibold tracking-wider text-primary uppercase">Dịch vụ</span>
          <h2 className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Các chương trình luyện tập Gym, Yoga, Calisthenic, Cardio, Boxing được thiết kế một cách khoa học và phù hợp bởi các chuyên gia.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-6">
          {services.map((service, index) => (
            <article
              key={service.title}
              className={`relative h-72 overflow-hidden rounded-none bg-card sm:h-80 lg:h-[350px] ${
                index < 3 ? "lg:col-span-2" : index === 3 ? "lg:col-span-2 lg:col-start-2" : "lg:col-span-2"
              }`}
            >
              <img
                src={service.image}
                alt={service.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-rose-900/25 " />
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                <h3 className="text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
                  {service.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
