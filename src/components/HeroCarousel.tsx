import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CarouselSlide {
  image: string;
  title: string;
  description: string;
}

const slides: CarouselSlide[] = [
  {
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    title: "Discover Amazing Destinations",
    description: "Explore breathtaking locations around the world",
  },
  {
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
    title: "Unforgettable Adventures",
    description: "Create memories that last a lifetime",
  },
  {
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
    title: "Luxury Accommodations",
    description: "Experience comfort in stunning hotels worldwide",
  },
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-2xl">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                <h2 className="text-3xl md:text-5xl font-bold mb-3">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-xl text-white/90">
                  {slide.description}
                </p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
};
