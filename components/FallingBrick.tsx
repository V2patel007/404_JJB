/**
 * FallingBrick.tsx
 * Positions and animates the one piece currently in flight. Cell size is
 * passed down from BrickBoard so the whole thing scales responsively.
 */
import { motion } from "framer-motion";
import { Brick } from "./Brick";
import { FallingPiece } from "../utils/generateBrick";

interface FallingBrickProps {
  piece: FallingPiece;
  row: number;
  cellSize: number;
}

export function FallingBrick({ piece, row, cellSize }: FallingBrickProps) {
  const width = piece.vertical ? cellSize : cellSize * piece.length;
  const height = piece.vertical ? cellSize * piece.length : cellSize;
  const x = piece.col * cellSize;
  const y = row * cellSize;

  return (
    <motion.div
      className="absolute"
      style={{ width, height, left: x }}
      initial={{ y: y - cellSize * 2, rotate: -6, opacity: 0 }}
      animate={{ y, rotate: [-6, 3, 0], opacity: 1 }}
      transition={{
        y: { type: "tween", duration: 0.09 / piece.speed, ease: "linear" },
        rotate: { duration: 0.4, ease: "easeOut" },
        opacity: { duration: 0.15 },
      }}
    >
      <div className="grid w-full h-full" style={{ gridTemplateColumns: `repeat(${piece.length}, 1fr)` }}>
        <Brick typeId={piece.typeId} span={piece.length} vertical={piece.vertical} className="w-full h-full" />
      </div>
    </motion.div>
  );
}
