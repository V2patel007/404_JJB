/**
 * useBrickPhysics.ts
 * Owns all board state: the settled grid, the currently falling piece,
 * dust-particle bursts, and the never-ending spawn loop. UI components
 * only read from this hook — no physics logic leaks into JSX.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  canOccupy,
  clearRows,
  createEmptyGrid,
  findFullRows,
  findLandingRow,
  settlePiece,
} from "../utils/collision";
import { CellState, FALL_TICK_MS, GRID_ROWS, SPAWN_INTERVAL_MAX, SPAWN_INTERVAL_MIN } from "../utils/constants";
import { FallingPiece, generateBrick } from "../utils/generateBrick";
import { useAnimationLoop } from "./useAnimationLoop";

function makeDustId(kind: "land" | "clear", pieceId: string, index?: number): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return index === undefined ? `${kind}-${pieceId}-${suffix}` : `${kind}-${pieceId}-${index}-${suffix}`;
}

export interface DustBurst {
  id: string;
  row: number;
  col: number;
  /** "land" = small puff under a freshly landed brick, "clear" = full row sweep */
  kind: "land" | "clear";
}

interface PhysicsState {
  grid: CellState[][];
  fallingPiece: FallingPiece | null;
  fallingRow: number;
  dust: DustBurst[];
  /** id of the piece that just landed, used to trigger a one-shot glow/bounce */
  justLandedId: string | null;
}

export function useBrickPhysics(reducedMotion: boolean) {
  const [state, setState] = useState<PhysicsState>({
    grid: createEmptyGrid(),
    fallingPiece: null,
    fallingRow: 0,
    dust: [],
    justLandedId: null,
  });

  const nextSpawnDelay = useRef(SPAWN_INTERVAL_MIN);

  const spawn = useCallback(() => {
    setState((prev) => {
      if (prev.fallingPiece) return prev; // one piece in flight at a time
      const piece = generateBrick();
      return { ...prev, fallingPiece: piece, fallingRow: piece.row, justLandedId: null };
    });
  }, []);

  const dustTimeouts = useRef<number[]>([]);
  useEffect(() => () => dustTimeouts.current.forEach((t) => window.clearTimeout(t)), []);

  const pushDust = useCallback((bursts: DustBurst[]) => {
    setState((prev) => ({ ...prev, dust: [...prev.dust, ...bursts] }));
    bursts.forEach((b) => {
      const t = window.setTimeout(() => {
        setState((prev) => ({ ...prev, dust: prev.dust.filter((d) => d.id !== b.id) }));
      }, 650);
      dustTimeouts.current.push(t);
    });
  }, []);

  // --- Spawn loop: schedules the next piece at a randomized interval ---
  useEffect(() => {
    if (reducedMotion) return undefined;
    let timeoutId: number;
    const scheduleNext = () => {
      const delay = SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
      timeoutId = window.setTimeout(() => {
        spawn();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => window.clearTimeout(timeoutId);
  }, [spawn, reducedMotion]);

  // Kick off a first piece immediately so the board isn't empty on load.
  useEffect(() => {
    spawn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fall tick: advances the active piece one row, or lands it ---
  const fallTick = useCallback(() => {
    setState((prev) => {
      if (!prev.fallingPiece) return prev;
      const piece = prev.fallingPiece;
      const nextRow = prev.fallingRow + 1;

      if (canOccupy(prev.grid, piece, nextRow)) {
        return { ...prev, fallingRow: nextRow };
      }

      // Landed: settle into the grid.
      const landingRow = findLandingRow(prev.grid, { ...piece, row: prev.fallingRow });
      let grid = settlePiece(prev.grid, piece, landingRow);

      const landDust: DustBurst = {
        id: makeDustId("land", piece.id),
        row: Math.min(landingRow + piece.length - 1, GRID_ROWS - 1),
        col: piece.col,
        kind: "land",
      };

      const fullRows = findFullRows(grid);
      const clearDust: DustBurst[] = fullRows.map((r, i) => ({
        id: makeDustId("clear", piece.id, i),
        row: r,
        col: 4,
        kind: "clear" as const,
      }));

      if (fullRows.length > 0) {
        // Give the clear animation a beat before actually removing rows.
        window.setTimeout(() => {
          setState((s) => ({ ...s, grid: clearRows(s.grid, fullRows) }));
        }, 260);
      }

      pushDust([landDust, ...clearDust]);

      return {
        ...prev,
        grid,
        fallingPiece: null,
        fallingRow: 0,
        justLandedId: piece.id,
      };
    });
  }, [pushDust]);

  useAnimationLoop(fallTick, FALL_TICK_MS, !reducedMotion);

  // In reduced-motion mode, settle pieces instantly with no falling animation.
  useEffect(() => {
    if (!reducedMotion || !state.fallingPiece) return;
    const piece = state.fallingPiece;
    const landingRow = findLandingRow(state.grid, piece);
    const grid = settlePiece(state.grid, piece, landingRow);
    const fullRows = findFullRows(grid);
    const finalGrid = fullRows.length ? clearRows(grid, fullRows) : grid;
    setState((prev) => ({ ...prev, grid: finalGrid, fallingPiece: null, justLandedId: piece.id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, state.fallingPiece]);

  return {
    grid: state.grid,
    fallingPiece: state.fallingPiece,
    fallingRow: state.fallingRow,
    dust: state.dust,
    justLandedId: state.justLandedId,
  };
}
