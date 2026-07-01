/**
 * FloatingParticles.tsx
 * Slow-drifting ambient motes behind the whole hero. Purely decorative,
 * so it is aria-hidden and fully skipped under prefers-reduced-motion.
 */
import { motion } from "framer-motion";
import { useMemo } from "react";

interface FloatingParticlesProps {
  count?: number;
  reducedMotion: boolean;
}

export function FloatingParticles({ count = 22, reducedMotion }: FloatingParticlesProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        duration: 14 + Math.random() * 18,
        delay: Math.random() * -20,
        drift: 20 + Math.random() * 40,
      })),
    [count]
  );

  if (reducedMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-white/10"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -p.drift, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
