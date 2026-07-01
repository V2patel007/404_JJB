/**
 * useAnimationLoop.ts
 * A rAF-driven "interval" that:
 *  - pauses automatically when the tab is not visible (perf + battery),
 *  - can be globally disabled (used for prefers-reduced-motion),
 *  - calls back at roughly `intervalMs`, independent of React re-renders.
 */
import { useEffect, useRef } from "react";

export function useAnimationLoop(
  callback: (deltaMs: number) => void,
  intervalMs: number,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);
  const rafId = useRef<number | null>(null);
  const lastTick = useRef<number>(0);
  const lastTimestamp = useRef<number>(0);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    let isVisible = document.visibilityState !== "hidden";

    const onVisibility = () => {
      isVisible = document.visibilityState !== "hidden";
      // reset timers so we don't "catch up" with a burst of ticks
      lastTick.current = performance.now();
      lastTimestamp.current = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const tick = (timestamp: number) => {
      if (isVisible) {
        const delta = timestamp - (lastTimestamp.current || timestamp);
        lastTimestamp.current = timestamp;
        if (timestamp - lastTick.current >= intervalMs) {
          lastTick.current = timestamp;
          savedCallback.current(delta);
        }
      } else {
        lastTimestamp.current = timestamp;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [intervalMs, enabled]);
}
