"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Reveal } from "@/components/ui/reveal";

const GAMES = [
  { slug: "valorant", name: "Valorant", hero: "/games/valorant-hero.jpg", logo: "/games/valorant-logo.png" },
  {
    slug: "rocket-league",
    name: "Rocket League",
    hero: "/games/rocket-league-hero.jpg",
    logo: "/games/rocket-league-logo.png",
  },
  { slug: "cs2", name: "CS2", hero: "/games/cs2-hero.jpg", logo: "/games/cs2-logo.png" },
];

export function GameShowcase() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {GAMES.map((game, i) => (
        <Reveal key={game.slug} delay={i * 0.1}>
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.25 }}
            className="group relative h-56 overflow-hidden rounded-xl border border-border"
          >
            <Image
              src={game.hero}
              alt={game.name}
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-surface-raised/80 p-1.5 backdrop-blur">
                <Image src={game.logo} alt="" width={32} height={32} unoptimized className="object-contain" />
              </span>
              <span className="font-display text-base font-bold uppercase tracking-wide text-foreground">
                {game.name}
              </span>
            </div>
          </motion.div>
        </Reveal>
      ))}
    </div>
  );
}
