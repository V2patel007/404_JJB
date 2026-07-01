/**
 * DustParticle.tsx
 * A small burst of 5-7 motion particles. `kind="land"` is a tight little
 * puff; `kind="clear"` is a wider sweep across the row that just vanished.
 */
import { motion } from "framer-motion";
import { useMemo } from "react";
import { DustBurst } from "../hooks/useBrickPhysics";

interface DustParticleProps {
  burst: DustBurst;
  cellSize: number;
}

export function DustParticle({ burst, cellSize }: DustParticleProps) {
  const count = burst.kind === "clear" ? 10 : 6;
  const spreadX = burst.kind === "clear" ? cellSize * 9 : cellSize * 1.4;

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        dx: (Math.random() - 0.5) * spreadX,
        dy: -(Math.random() * cellSize * 1.2) - 4,
        delay: Math.random() * 0.08,
        size: 2 + Math.random() * 3,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const top = burst.row * cellSize + cellSize / 2;
  const left = burst.kind === "clear" ? cellSize * 5 : burst.col * cellSize + cellSize / 2;

  return (
    <div className="absolute pointer-events-none" style={{ top, left }} aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-[#E8C9A8]"
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 0.9 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0 }}
          transition={{ duration: 0.55, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
