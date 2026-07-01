/**
 * collision.ts
 * Pure functions over a CellState[][] grid: where a piece lands, whether
 * it can drop further, and how full rows clear + settle (classic Tetris
 * "shift everything above down by one").
 */
import { CellState, EMPTY_CELL, GRID_COLS, GRID_ROWS } from "./constants";
import { FallingPiece, pieceCells } from "./generateBrick";

export function createEmptyGrid(): CellState[][] {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ ...EMPTY_CELL }))
  );
}

/** Can the piece occupy `row` (its current bounding-box top) without collision? */
export function canOccupy(grid: CellState[][], piece: FallingPiece, row: number): boolean {
  const cells = pieceCells(piece, row);
  for (const cell of cells) {
    if (cell.col < 0 || cell.col >= GRID_COLS) return false;
    if (cell.row >= GRID_ROWS) return false;
    if (cell.row >= 0 && grid[cell.row][cell.col].filled) return false;
  }
  return true;
}

/** Find the resting row for a piece by scanning down from its current row. */
export function findLandingRow(grid: CellState[][], piece: FallingPiece): number {
  let row = piece.row;
  while (canOccupy(grid, piece, row + 1)) {
    row += 1;
  }
  return row;
}

/** Stamp a piece's cells into the grid as settled/filled. Mutates a copy. */
export function settlePiece(
  grid: CellState[][],
  piece: FallingPiece,
  landingRow: number
): CellState[][] {
  const next = grid.map((r) => r.map((c) => ({ ...c })));
  const cells = pieceCells(piece, landingRow);
  for (const cell of cells) {
    if (cell.row >= 0 && cell.row < GRID_ROWS) {
      next[cell.row][cell.col] = {
        filled: true,
        typeId: piece.typeId,
        pieceId: piece.id,
      };
    }
  }
  return next;
}

/** Returns row indices (0 = top) that are completely filled. */
export function findFullRows(grid: CellState[][]): number[] {
  const rows: number[] = [];
  grid.forEach((row, index) => {
    if (row.every((cell) => cell.filled)) rows.push(index);
  });
  return rows;
}

/** Clears the given rows and shifts everything above them down. */
export function clearRows(grid: CellState[][], rows: number[]): CellState[][] {
  if (rows.length === 0) return grid;
  const rowSet = new Set(rows);
  const remaining = grid.filter((_, index) => !rowSet.has(index));
  const blanks = Array.from({ length: rows.length }, () =>
    Array.from({ length: GRID_COLS }, () => ({ ...EMPTY_CELL }))
  );
  return [...blanks, ...remaining];
}
