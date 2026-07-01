/**
 * NotFound.tsx
 * The route-level 404 page rendered with the preview-inspired animated board.
 */
import { useEffect, useRef, useState, type TouchEvent } from "react";

type BrickTypeId = "traditional" | "linear" | "limousine";

interface ParticleState {
  id: number;
  size: number;
  left: string;
  top: string;
  duration: string;
  delay: string;
}

interface CellState {
  typeId: BrickTypeId;
  glow?: boolean;
}

interface FallingPiece {
  id: string;
  typeId: BrickTypeId;
  length: number;
  vertical: boolean;
  col: number;
  row: number;
}

interface DustBurst {
  id: string;
  row: number;
  col: number;
  kind: "land" | "clear";
}

interface BoardState {
  grid: Array<Array<CellState | null>>;
  activePiece: FallingPiece | null;
  activeRow: number;
  dust: DustBurst[];
  score: number;
  level: number;
  lines: number;
  paused: boolean;
  gameOver: boolean;
  lockDelay: number;
}

const COLS = 10;
const ROWS = 20;
const TYPES: Record<BrickTypeId, { length: number; className: string }> = {
  traditional: { length: 1, className: "traditional" },
  linear: { length: 4, className: "linear" },
  limousine: { length: 6, className: "limousine" },
};

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array<CellState | null>(COLS).fill(null));
const createPiece = (idCounter: { current: number }): FallingPiece => {
  const roll = Math.random();
  const typeId: BrickTypeId = roll < 0.08 ? "limousine" : roll < 0.36 ? "linear" : "traditional";
  const def = TYPES[typeId];
  const vertical = def.length > 1 && Math.random() < 0.35;
  const span = vertical ? 1 : def.length;
  const maxCol = Math.max(0, COLS - span);
  const col = Math.floor(Math.random() * (maxCol + 1));
  idCounter.current += 1;
  return {
    id: `p${idCounter.current}`,
    typeId,
    length: def.length,
    vertical,
    col,
    row: vertical ? -def.length : -1,
  };
};

const pieceCells = (piece: FallingPiece, atRow: number) => {
  const cells: Array<{ row: number; col: number }> = [];
  for (let index = 0; index < piece.length; index += 1) {
    cells.push(piece.vertical ? { row: atRow + index, col: piece.col } : { row: atRow, col: piece.col + index });
  }
  return cells;
};

const canOccupy = (grid: Array<Array<CellState | null>>, piece: FallingPiece, atRow: number) => {
  const cells = pieceCells(piece, atRow);
  for (const cell of cells) {
    if (cell.col < 0 || cell.col >= COLS) return false;
    if (cell.row >= ROWS) return false;
    if (cell.row >= 0 && grid[cell.row][cell.col]) return false;
  }
  return true;
};

const findLandingRow = (grid: Array<Array<CellState | null>>, piece: FallingPiece) => {
  let row = piece.row;
  while (canOccupy(grid, piece, row + 1)) row += 1;
  return row;
};

const settlePiece = (grid: Array<Array<CellState | null>>, piece: FallingPiece, landRow: number) => {
  const nextGrid = grid.map((row) => [...row]);
  const cells = pieceCells(piece, landRow);
  for (const cell of cells) {
    if (cell.row >= 0 && cell.row < ROWS) {
      nextGrid[cell.row][cell.col] = { typeId: piece.typeId };
    }
  }
  return nextGrid;
};

const findFullRows = (grid: Array<Array<CellState | null>>) => {
  const rows: number[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    if (grid[row].every(Boolean)) rows.push(row);
  }
  return rows;
};

const clearRows = (grid: Array<Array<CellState | null>>, rowsToClear: number[]) => {
  if (!rowsToClear.length) return grid;
  const rowSet = new Set(rowsToClear);
  const remaining = grid.filter((_, index) => !rowSet.has(index));
  const blanks = rowsToClear.map(() => Array<CellState | null>(COLS).fill(null));
  return [...blanks, ...remaining];
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return reduced;
}

export default function NotFound() {
  const reducedMotion = usePrefersReducedMotion();
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(24);
  const [particles, setParticles] = useState<ParticleState[]>([]);
  const [swipeFeedback, setSwipeFeedback] = useState<string | null>(null);
  const [boardState, setBoardState] = useState<BoardState>({
    grid: createEmptyGrid(),
    activePiece: null,
    activeRow: 0,
    dust: [],
    score: 0,
    level: 1,
    lines: 0,
    paused: false,
    gameOver: false,
    lockDelay: 220,
  });
  const idCounter = useRef(0);
  const dustTimeouts = useRef<number[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeTimeoutRef = useRef<number | null>(null);

  const triggerSwipeFeedback = (label: string) => {
    setSwipeFeedback(label);
    if (swipeTimeoutRef.current) window.clearTimeout(swipeTimeoutRef.current);
    swipeTimeoutRef.current = window.setTimeout(() => setSwipeFeedback(null), 180);
  };

  const settleActivePiece = (prev: BoardState, piece: FallingPiece, landRow: number) => {
    const nextGrid = settlePiece(prev.grid, piece, landRow);
    const landDust: DustBurst = {
      id: `land-${piece.id}`,
      row: Math.min(landRow + piece.length - 1, ROWS - 1),
      col: piece.col,
      kind: "land",
    };
    const fullRows = findFullRows(nextGrid);
    const clearDust = fullRows.map((row, index) => ({
      id: `clear-${piece.id}-${index}`,
      row,
      col: 4,
      kind: "clear" as const,
    }));

    const bursts = [landDust, ...clearDust];
    bursts.forEach((burst) => {
      const timeoutId = window.setTimeout(() => {
        setBoardState((current) => ({ ...current, dust: current.dust.filter((item) => item.id !== burst.id) }));
      }, 650);
      dustTimeouts.current.push(timeoutId);
    });

    if (fullRows.length) {
      window.setTimeout(() => {
        setBoardState((current) => ({
          ...current,
          grid: clearRows(current.grid, fullRows),
        }));
      }, 260);
    }

    const clearedCount = fullRows.length;
    const scoreGained =
      clearedCount === 0
        ? (piece.typeId === "limousine" ? 500 : 0)
        : [0, 100, 300, 500, 800][clearedCount] ?? 800;
    const nextLevel = Math.floor((prev.lines + clearedCount) / 10) + 1;

    return {
      ...prev,
      grid: nextGrid,
      activePiece: null,
      activeRow: 0,
      dust: [...prev.dust, ...bursts],
      score: prev.score + scoreGained + (piece.typeId === "limousine" && clearedCount === 0 ? 500 : 0),
      lines: prev.lines + clearedCount,
      level: nextLevel,
      lockDelay: Math.max(140, 220 - (nextLevel - 1) * 10),
    };
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 28) {
      const action = deltaX > 0 ? "right" : "left";
      triggerSwipeFeedback(action === "right" ? "→" : "←");
      handleControl(action);
      return;
    }

    if (Math.abs(deltaY) > 28) {
      const action = deltaY < 0 ? "rotate" : "down";
      triggerSwipeFeedback(action === "rotate" ? "↻" : "↓");
      handleControl(action);
    }
  };

  const handleControl = (action: "left" | "right" | "down" | "rotate" | "drop") => {
    setBoardState((prev) => {
      if (!prev.activePiece || prev.paused || prev.gameOver) return prev;
      const piece = prev.activePiece;

      switch (action) {
        case "left": {
          const nextPiece = { ...piece, col: piece.col - 1 };
          return canOccupy(prev.grid, nextPiece, prev.activeRow)
            ? { ...prev, activePiece: nextPiece }
            : prev;
        }
        case "right": {
          const nextPiece = { ...piece, col: piece.col + 1 };
          return canOccupy(prev.grid, nextPiece, prev.activeRow)
            ? { ...prev, activePiece: nextPiece }
            : prev;
        }
        case "down": {
          if (canOccupy(prev.grid, piece, prev.activeRow + 1)) {
            return { ...prev, activeRow: prev.activeRow + 1, score: prev.score + 1 };
          }
          return settleActivePiece(prev, piece, findLandingRow(prev.grid, { ...piece, row: prev.activeRow }));
        }
        case "rotate": {
          if (piece.length <= 1) return prev;
          const candidate = { ...piece, vertical: !piece.vertical, col: Math.min(piece.col, Math.max(0, COLS - (piece.vertical ? piece.length : 1))) };
          return canOccupy(prev.grid, candidate, prev.activeRow)
            ? { ...prev, activePiece: candidate }
            : prev;
        }
        case "drop": {
          const landingRow = findLandingRow(prev.grid, { ...piece, row: prev.activeRow });
          return {
            ...settleActivePiece(prev, piece, landingRow),
            score: prev.score + 2 * (landingRow - prev.activeRow),
          };
        }
        default:
          return prev;
      }
    });
  };

  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        size: 1 + Math.random() * 2.5,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: `${14 + Math.random() * 18}s`,
        delay: `${-Math.random() * 20}s`,
      }))
    );
  }, []);

  useEffect(() => {
    const element = boardRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setCellSize(width / COLS);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      dustTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      dustTimeouts.current = [];
      if (swipeTimeoutRef.current) window.clearTimeout(swipeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || boardState.paused || boardState.gameOver) return undefined;

    let spawnTimeout: number | undefined;
    let tickInterval: number | undefined;

    const spawn = () => {
      setBoardState((prev) => {
        if (prev.activePiece || prev.gameOver || prev.paused) return prev;
        const piece = createPiece(idCounter);
        if (!canOccupy(prev.grid, piece, piece.row)) {
          return { ...prev, gameOver: true };
        }
        return { ...prev, activePiece: piece, activeRow: piece.row };
      });
    };

    const pushDust = (bursts: DustBurst[]) => {
      setBoardState((prev) => ({ ...prev, dust: [...prev.dust, ...bursts] }));
      bursts.forEach((burst) => {
        const timeoutId = window.setTimeout(() => {
          setBoardState((prev) => ({ ...prev, dust: prev.dust.filter((item) => item.id !== burst.id) }));
        }, 650);
        dustTimeouts.current.push(timeoutId);
      });
    };

    const tick = () => {
      setBoardState((prev) => {
        if (!prev.activePiece || prev.paused || prev.gameOver) return prev;
        const nextRow = prev.activeRow + 1;
        if (canOccupy(prev.grid, prev.activePiece, nextRow)) {
          return { ...prev, activeRow: nextRow };
        }

        const piece = prev.activePiece;
        const landRow = findLandingRow(prev.grid, { ...piece, row: prev.activeRow });
        return settleActivePiece(prev, piece, landRow);
      });
    };

    const scheduleNextSpawn = () => {
      const delay = Math.max(220, 900 - (boardState.level - 1) * 95) + Math.random() * 180;
      spawnTimeout = window.setTimeout(() => {
        spawn();
        scheduleNextSpawn();
      }, delay);
    };

    spawn();
    scheduleNextSpawn();
    tickInterval = window.setInterval(tick, Math.max(90, 360 - (boardState.level - 1) * 28));

    return () => {
      if (spawnTimeout) window.clearTimeout(spawnTimeout);
      if (tickInterval) window.clearInterval(tickInterval);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "p":
        case "P":
          event.preventDefault();
          setBoardState((prev) => ({ ...prev, paused: !prev.paused }));
          break;
        case "r":
        case "R":
          event.preventDefault();
          setBoardState({
            grid: createEmptyGrid(),
            activePiece: null,
            activeRow: 0,
            dust: [],
            score: 0,
            level: 1,
            lines: 0,
            paused: false,
            gameOver: false,
            lockDelay: 220,
          });
          break;
        case "ArrowLeft":
          event.preventDefault();
          handleControl("left");
          break;
        case "ArrowRight":
          event.preventDefault();
          handleControl("right");
          break;
        case "ArrowDown":
          event.preventDefault();
          handleControl("down");
          break;
        case "ArrowUp":
          event.preventDefault();
          handleControl("rotate");
          break;
        case " ":
        case "Spacebar":
          event.preventDefault();
          handleControl("drop");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reducedMotion]);

  const resetGame = () => {
    setBoardState({
      grid: createEmptyGrid(),
      activePiece: null,
      activeRow: 0,
      dust: [],
      score: 0,
      level: 1,
      lines: 0,
      paused: false,
      gameOver: false,
      lockDelay: 220,
    });
  };

  const togglePause = () => {
    setBoardState((prev) => ({ ...prev, paused: !prev.paused }));
  };

  const handleGoHome = () => {
    window.location.assign("/");
  };

  const handleGoBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  };

  const boardHeight = `${(cellSize || 24) * ROWS}px`;
  const activePiece = boardState.activePiece;
  const activePieceWidth = activePiece ? (activePiece.vertical ? cellSize : cellSize * activePiece.length) : 0;
  const activePieceHeight = activePiece ? (activePiece.vertical ? cellSize * activePiece.length : cellSize) : 0;

  return (
    <>
      <div className="bg-grid" />
      <div className="bg-glow" />
      <div className="bg-vignette" />
      <div className="particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: particle.left,
              top: particle.top,
              animationDuration: particle.duration,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <main className="wrap">
        <section className="hero">
          <p className="eyebrow">Error 404</p>
          <h1 className="big">404</h1>
          <h2 className="sub">Oops! This page couldn&apos;t find its place.</h2>
          <p className="desc">
            Looks like this page fell into the wrong stack of bricks. Let&apos;s get you back where everything fits together.
          </p>
          <div className="actions">
            <button type="button" className="btn-primary" onClick={handleGoHome}>
              Go Home
            </button>
            <button type="button" className="btn-secondary" onClick={handleGoBack}>
              Go Back
            </button>
          </div>

          <div className="game-stats">
            <div className="stat-pill">Score: {boardState.score}</div>
            <div className="stat-pill">Level: {boardState.level}</div>
            <div className="stat-pill">Lines: {boardState.lines}</div>
          </div>

          <div className="game-controls-row">
            <button type="button" className="btn-secondary" onClick={togglePause}>
              {boardState.paused ? "Resume" : "Pause"}
            </button>
            <button type="button" className="btn-primary" onClick={resetGame}>
              Restart
            </button>
          </div>

          <div className="control-hint" aria-label="Game controls">
            <span className="control-label">Keyboard: ← → ↓ ↑ · Space</span>
            <span className="swipe-hint">Swipe on the board to move, rotate, or drop.</span>
            <div className="control-row">
              <button type="button" className="control-button" onClick={() => handleControl("left")} aria-label="Move left">
                ←
              </button>
              <button type="button" className="control-button" onClick={() => handleControl("rotate")} aria-label="Rotate">
                ↻
              </button>
              <button type="button" className="control-button" onClick={() => handleControl("down")} aria-label="Soft drop">
                ↓
              </button>
              <button type="button" className="control-button" onClick={() => handleControl("right")} aria-label="Move right">
                →
              </button>
            </div>
            <button type="button" className="control-button control-button-wide" onClick={() => handleControl("drop")} aria-label="Hard drop">
              Hard Drop
            </button>
          </div>
        </section>

        <section className="board-outer">
          <div
            ref={boardRef}
            className={`board ${reducedMotion ? "board-static" : "board-live"}${swipeFeedback ? " board-swipe" : ""}`}
            role="img"
            aria-label="Decorative animation of clay bricks endlessly falling and stacking, forming and clearing rows"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ display: reducedMotion ? "flex" : undefined, alignItems: reducedMotion ? "center" : undefined, justifyContent: reducedMotion ? "center" : undefined, height: boardHeight, touchAction: "none" }}
          >
            {boardState.gameOver && (
              <div className="game-overlay">
                <h3>Game Over</h3>
                <p>Score: {boardState.score}</p>
                <p>Level: {boardState.level}</p>
                <p>Lines: {boardState.lines}</p>
                <div className="overlay-actions">
                  <button type="button" className="btn-primary" onClick={resetGame}>Restart</button>
                  <button type="button" className="btn-secondary" onClick={handleGoHome}>Return Home</button>
                </div>
              </div>
            )}
            {boardState.paused && !boardState.gameOver && (
              <div className="game-overlay">
                <h3>Paused</h3>
                <p>Press P to resume</p>
              </div>
            )}
            {!reducedMotion ? (
              <>
                <div className="board-gridlines" />
                {boardState.grid.flatMap((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    if (!cell) return null;
                    const brickClass = TYPES[cell.typeId].className;
                    return (
                      <div
                        key={`settled-${rowIndex}-${colIndex}`}
                        className={`brick ${brickClass}`}
                        style={{ top: `${rowIndex * cellSize}px`, left: `${colIndex * cellSize}px`, width: `${cellSize}px`, height: `${cellSize}px` }}
                      />
                    );
                  })
                )}
                {activePiece && (
                  <div
                    className={`brick spawning ${TYPES[activePiece.typeId].className}`}
                    style={{ top: `${boardState.activeRow * cellSize}px`, left: `${activePiece.col * cellSize}px`, width: `${activePieceWidth}px`, height: `${activePieceHeight}px` }}
                  />
                )}
                {boardState.dust.map((burst) => (
                  <span
                    key={burst.id}
                    className="dust"
                    style={{
                      top: `${burst.row * cellSize + cellSize / 2}px`,
                      left: `${burst.kind === "clear" ? cellSize * 5 : burst.col * cellSize + cellSize / 2}px`,
                      width: `${2 + Math.random() * 3}px`,
                      height: `${2 + Math.random() * 3}px`,
                      ['--dx' as string]: `${(Math.random() - 0.5) * (burst.kind === "clear" ? cellSize * 9 : cellSize * 1.4)}px`,
                      ['--dy' as string]: `${-(Math.random() * cellSize * 1.2) - 4}px`,
                      animationDelay: `${Math.random() * 0.08}s`,
                    }}
                  />
                ))}
              </>
            ) : (
              <span className="sr-only">Decorative brick illustration (animation reduced per your system preference)</span>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
