"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

const SLIDES = [
  { src: "/games/valorant-hero.jpg", alt: "Valorant" },
  { src: "/games/rocket-league-hero.jpg", alt: "Rocket League" },
  { src: "/games/cs2-hero.jpg", alt: "CS2" },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={SLIDES[index].src}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={SLIDES[index].src}
            alt={SLIDES[index].alt}
            fill
            priority={index === 0}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-canvas/60 via-transparent to-canvas/60" />
    </div>
  );
}
