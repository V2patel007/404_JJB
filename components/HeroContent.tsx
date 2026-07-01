/**
 * HeroContent.tsx
 * The text + actions half of the hero. Entrance animation is a single
 * orchestrated stagger, not scattered per-element effects.
 */
import { motion, type Variants } from "framer-motion";

interface HeroContentProps {
  onGoHome: () => void;
  onGoBack: () => void;
  reducedMotion: boolean;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function HeroContent({ onGoHome, onGoBack, reducedMotion }: HeroContentProps) {
  return (
    <motion.div
      className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-xl"
      variants={reducedMotion ? undefined : container}
      initial={reducedMotion ? undefined : "hidden"}
      animate={reducedMotion ? undefined : "show"}
    >
      <motion.p
        variants={reducedMotion ? undefined : item}
        className="font-mono text-sm tracking-[0.2em] uppercase text-[#D97C52] mb-4"
      >
        Error 404
      </motion.p>

      <motion.h1
        variants={reducedMotion ? undefined : item}
        className="font-display text-[clamp(4.5rem,14vw,9rem)] leading-[0.9] font-semibold text-[#F5F1EB] tracking-tight"
      >
        404
      </motion.h1>

      <motion.h2
        variants={reducedMotion ? undefined : item}
        className="mt-5 font-display text-2xl sm:text-3xl font-medium text-[#F5F1EB]"
      >
        Oops! This page couldn&apos;t find its place.
      </motion.h2>

      <motion.p
        variants={reducedMotion ? undefined : item}
        className="mt-4 text-base sm:text-lg text-[#A9A29A] leading-relaxed max-w-md"
      >
        Looks like this page fell into the wrong stack of bricks. Let&apos;s get you back
        where everything fits together.
      </motion.p>

      <motion.div
        variants={reducedMotion ? undefined : item}
        className="mt-9 flex flex-col sm:flex-row w-full sm:w-auto gap-3"
      >
        <button
          type="button"
          onClick={onGoHome}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#D97C52] text-[#1A140F] font-medium
            hover:bg-[#E8916B] active:bg-[#C06A43] transition-colors
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D97C52]"
        >
          Go Home
        </button>
        <button
          type="button"
          onClick={onGoBack}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/5 text-[#F5F1EB] font-medium border border-white/15
            hover:bg-white/10 active:bg-white/[0.03] transition-colors
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          Go Back
        </button>
      </motion.div>
    </motion.div>
  );
}
