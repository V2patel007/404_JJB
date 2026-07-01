/**
 * constants.ts
 * Single source of truth for the brick-board grid, timing and palette.
 * Keeping every "magic number" here means the physics, rendering and
 * animation layers all agree on the same board shape.
 */

export const GRID_COLS = 10;
export const GRID_ROWS = 20;

/** How often (ms) a new brick is allowed to spawn, min/max for jitter. */
export const SPAWN_INTERVAL_MIN = 1400;
export const SPAWN_INTERVAL_MAX = 2600;

/** Cell "gravity" tick — how often the falling piece drops one row. */
export const FALL_TICK_MS = 90;

/** Chance (0-1) that a spawned piece is rotated 90deg (vertical). */
export const ROTATION_CHANCE = 0.35;

/** Chance a limousine (1x6) brick is chosen instead of the weighted default. */
export const LIMOUSINE_RARITY = 0.08;
export const LINEAR_RARITY = 0.28;
// Remaining probability mass goes to the traditional 1x1 brick.

export type BrickTypeId = "traditional" | "linear" | "limousine";

export interface BrickTypeDef {
  id: BrickTypeId;
  /** footprint length in cells before rotation */
  length: number;
  /** base clay tone */
  base: string;
  /** darker mortar/shadow tone */
  shadow: string;
  /** lighter highlight tone for the bevel */
  highlight: string;
}

export const BRICK_TYPES: Record<BrickTypeId, BrickTypeDef> = {
  traditional: {
    id: "traditional",
    length: 1,
    base: "#B5502E",
    shadow: "#7A3319",
    highlight: "#D97C52",
  },
  linear: {
    id: "linear",
    length: 4,
    base: "#A8482B",
    shadow: "#6E2F16",
    highlight: "#CE7248",
  },
  limousine: {
    id: "limousine",
    length: 6,
    base: "#8B3A22",
    shadow: "#5A230F",
    highlight: "#B85A34",
  },
};

/** Cell size is derived at runtime from the board's rendered width,
 *  but we keep a design-time reference (desktop) for aspect math. */
export const REFERENCE_CELL_PX = 46;

export const BOARD_ASPECT = GRID_COLS / GRID_ROWS; // width / height

/** Grid cell state kept for settled bricks. */
export interface CellState {
  filled: boolean;
  typeId: BrickTypeId | null;
  /** id of the piece this cell belonged to, used to fade dust of the same color */
  pieceId: string | null;
}

export const EMPTY_CELL: CellState = { filled: false, typeId: null, pieceId: null };
