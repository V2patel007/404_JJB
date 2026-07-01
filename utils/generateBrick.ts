/**
 * generateBrick.ts
 * Produces a new falling piece: a type, an orientation, and a spawn column,
 * clamped so the piece always starts fully inside the board.
 */
import {
  BRICK_TYPES,
  BrickTypeId,
  GRID_COLS,
  LIMOUSINE_RARITY,
  LINEAR_RARITY,
  ROTATION_CHANCE,
} from "./constants";

export interface FallingPiece {
  id: string;
  typeId: BrickTypeId;
  /** true = oriented vertically (tall), false = horizontal (wide) */
  vertical: boolean;
  /** length in cells (1, 4 or 6) */
  length: number;
  /** current top-left column of the piece's bounding box */
  col: number;
  /** current top row of the piece's bounding box (can be negative while entering) */
  row: number;
  /** fall speed multiplier, small randomization keeps the board feeling alive */
  speed: number;
}

function pickTypeId(): BrickTypeId {
  const roll = Math.random();
  if (roll < LIMOUSINE_RARITY) return "limousine";
  if (roll < LIMOUSINE_RARITY + LINEAR_RARITY) return "linear";
  return "traditional";
}

let counter = 0;

export function generateBrick(): FallingPiece {
  const typeId = pickTypeId();
  const def = BRICK_TYPES[typeId];
  // 1x1 bricks have no meaningful rotation.
  const vertical = def.length > 1 && Math.random() < ROTATION_CHANCE;
  const length = def.length;

  const span = vertical ? 1 : length;
  const maxCol = Math.max(0, GRID_COLS - span);
  const col = Math.floor(Math.random() * (maxCol + 1));

  counter += 1;

  return {
    id: `brick-${Date.now()}-${counter}`,
    typeId,
    vertical,
    length,
    col,
    row: vertical ? -length : -1,
    speed: 0.85 + Math.random() * 0.5,
  };
}

/** Returns the list of {row, col} cells a piece occupies at a given row offset. */
export function pieceCells(
  piece: Pick<FallingPiece, "vertical" | "length" | "col">,
  atRow: number
): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < piece.length; i += 1) {
    cells.push(
      piece.vertical
        ? { row: atRow + i, col: piece.col }
        : { row: atRow, col: piece.col + i }
    );
  }
  return cells;
}
