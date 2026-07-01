/**
 * BrickBoard.tsx
 * The right-hand (or, on mobile, lower) animated board. Measures its own
 * width via ResizeObserver so cellSize adapts across breakpoints without
 * any hard-coded per-device branching.
 */
import { useEffect, useRef, useState } from "react";
import { Brick } from "./Brick";
import { FallingBrick } from "./FallingBrick";
import { DustParticle } from "./DustParticle";
import { useBrickPhysics } from "../hooks/useBrickPhysics";
import { GRID_COLS, GRID_ROWS } from "../utils/constants";

interface BrickBoardProps {
  reducedMotion: boolean;
}

export function BrickBoard({ reducedMotion }: BrickBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(24);
  const { grid, fallingPiece, fallingRow, dust, justLandedId } = useBrickPhysics(reducedMotion);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setCellSize(width / GRID_COLS);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative w-full max-w-[500px] mx-auto"
      role="img"
      aria-label="Decorative animation of clay bricks endlessly falling and stacking, forming and clearing rows"
    >
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
        style={{ aspectRatio: `${GRID_COLS} / ${GRID_ROWS}` }}
        aria-hidden="true"
      >
        {/* subtle inner grid lines */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: `${cellSize}px ${cellSize}px`,
          }}
        />

        {/* settled bricks */}
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell.filled && cell.typeId ? (
              <div
                key={`${r}-${c}`}
                className="absolute"
                style={{ top: r * cellSize, left: c * cellSize, width: cellSize, height: cellSize }}
              >
                <Brick
                  typeId={cell.typeId}
                  glow={cell.typeId === "limousine" && cell.pieceId === justLandedId}
                  className="w-full h-full"
                />
              </div>
            ) : null
          )
        )}

        {/* piece currently falling */}
        {fallingPiece && !reducedMotion && (
          <FallingBrick piece={fallingPiece} row={fallingRow} cellSize={cellSize} />
        )}

        {/* dust bursts */}
        {dust.map((d) => (
          <DustParticle key={d.id} burst={d} cellSize={cellSize} />
        ))}
      </div>
    </div>
  );
}
