/**
 * Brick.tsx
 * Renders one masonry unit. Memoized because dozens of these can be on
 * screen at once and only the falling piece actually changes per frame.
 */
import { memo } from "react";
import { BRICK_TYPES, BrickTypeId } from "../utils/constants";

export interface BrickProps {
  typeId: BrickTypeId;
  /** width in cells this particular visual segment spans (usually 1) */
  span?: number;
  vertical?: boolean;
  /** applies the 300ms limousine landing glow */
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function BrickBase({ typeId, span = 1, vertical = false, glow = false, className = "", style }: BrickProps) {
  const def = BRICK_TYPES[typeId];

  return (
    <div
      className={`relative rounded-[5px] overflow-hidden ${className}`}
      style={{
        gridColumn: vertical ? undefined : `span ${span}`,
        gridRow: vertical ? `span ${span}` : undefined,
        background: `linear-gradient(155deg, ${def.highlight} 0%, ${def.base} 42%, ${def.shadow} 100%)`,
        boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.35)`,
        border: "1px solid rgba(0,0,0,0.35)",
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Noise texture: CSS-only, no image assets */}
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 0.5px, transparent 0.5px), radial-gradient(rgba(0,0,0,0.6) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px, 5px 5px",
          backgroundPosition: "0 0, 2px 2px",
        }}
      />
      {/* Mortar grooves between sub-units for the longer bricks */}
      {span > 1 &&
        Array.from({ length: span - 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-black/25"
            style={
              vertical
                ? { left: 0, right: 0, top: `${((i + 1) / span) * 100}%`, height: "1.5px" }
                : { top: 0, bottom: 0, left: `${((i + 1) / span) * 100}%`, width: "1.5px" }
            }
          />
        ))}
      {glow && (
        <div
          className="absolute inset-0 rounded-[5px] animate-[brickGlow_300ms_ease-out]"
          style={{ boxShadow: "0 0 14px 4px rgba(255, 184, 120, 0.85)" }}
        />
      )}
    </div>
  );
}

export const Brick = memo(BrickBase);
