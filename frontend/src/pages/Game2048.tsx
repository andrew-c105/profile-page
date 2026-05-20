import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const COLS = 4;
const ROWS = 4;

// Index helpers
const rc = (idx: number): [number, number] => [Math.floor(idx / COLS), idx % COLS];
const ix = (row: number, col: number): number => row * COLS + col;

const TILE_COLORS: Record<number, string> = {
  0: "transparent",
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  128: "#edcf72",
  256: "#edcc61",
  512: "#edc850",
  1024: "#edc53f",
  2048: "#edc22e",
};

// Slide a single row LEFT
const slideRow = (row: number[]): { slid: number[]; gained: number } => {
  let filtered = row.filter((val) => val !== 0);
  let gained = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] = filtered[i] * 2;
      gained += filtered[i];
      filtered[i + 1] = 0;
    }
  }
  filtered = filtered.filter((val) => val !== 0);
  while (filtered.length < COLS) filtered.push(0);
  return { slid: filtered, gained };
};

const spawnTile = (grid: number[]): number[] => {
  const emptyIndexes: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === 0) emptyIndexes.push(i);
  }
  if (emptyIndexes.length === 0) return grid;
  const randomIndex = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
  const newGrid = [...grid];
  newGrid[randomIndex] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

const moveLeft = (grid: number[]): { newGrid: number[]; gained: number } => {
  const newGrid: number[] = [...grid];
  let gained = 0;
  for (let row = 0; row < ROWS; row++) {
    const rowArr: number[] = [];
    for (let col = 0; col < COLS; col++) rowArr.push(grid[ix(row, col)]);
    const { slid, gained: g } = slideRow(rowArr);
    gained += g;
    for (let col = 0; col < COLS; col++) newGrid[ix(row, col)] = slid[col];
  }
  return { newGrid, gained };
};

const moveRight = (grid: number[]): { newGrid: number[]; gained: number } => {
  const newGrid: number[] = [...grid];
  let gained = 0;
  for (let row = 0; row < ROWS; row++) {
    const rowArr: number[] = [];
    for (let col = COLS - 1; col >= 0; col--) rowArr.push(grid[ix(row, col)]);
    const { slid, gained: g } = slideRow(rowArr);
    gained += g;
    for (let col = 0; col < COLS; col++) newGrid[ix(row, COLS - 1 - col)] = slid[col];
  }
  return { newGrid, gained };
};

const moveUp = (grid: number[]): { newGrid: number[]; gained: number } => {
  const newGrid: number[] = [...grid];
  let gained = 0;
  for (let col = 0; col < COLS; col++) {
    const colArr: number[] = [];
    for (let row = 0; row < ROWS; row++) colArr.push(grid[ix(row, col)]);
    const { slid, gained: g } = slideRow(colArr);
    gained += g;
    for (let row = 0; row < ROWS; row++) newGrid[ix(row, col)] = slid[row];
  }
  return { newGrid, gained };
};

const moveDown = (grid: number[]): { newGrid: number[]; gained: number } => {
  const newGrid: number[] = [...grid];
  let gained = 0;
  for (let col = 0; col < COLS; col++) {
    const colArr: number[] = [];
    for (let row = ROWS - 1; row >= 0; row--) colArr.push(grid[ix(row, col)]);
    const { slid, gained: g } = slideRow(colArr);
    gained += g;
    for (let row = 0; row < ROWS; row++) newGrid[ix(ROWS - 1 - row, col)] = slid[row];
  }
  return { newGrid, gained };
};

const isGameOver = (grid: number[]): boolean => {
  if (grid.some((cell) => cell === 0)) return false;
  for (let i = 0; i < grid.length; i++) {
    const [row, col] = rc(i);
    if (col < COLS - 1 && grid[i] === grid[i + 1]) return false;
    if (row < ROWS - 1 && grid[i] === grid[i + COLS]) return false;
  }
  return true;
};

const initGrid = () => {
  let grid = Array(16).fill(0);
  grid = spawnTile(grid);
  grid = spawnTile(grid);
  return grid;
};

const Game2048 = () => {
  const [grid, setGrid] = useState(() => initGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      let result;
      if (e.key === "ArrowLeft") result = moveLeft(grid);
      else if (e.key === "ArrowRight") result = moveRight(grid);
      else if (e.key === "ArrowUp") result = moveUp(grid);
      else if (e.key === "ArrowDown") result = moveDown(grid);
      else return;

      e.preventDefault();
      let { newGrid, gained } = result;

      if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
        newGrid = spawnTile(newGrid);
        setGrid(newGrid);
        setScore((prev) => prev + gained);
        if (!won && newGrid.some((cell) => cell === 2048)) {
          setWon(true);
          alert("You win! Keep going or reset.");
        }
        if (isGameOver(newGrid)) setGameOver(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [grid, gameOver, won]);

  const resetGame = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center py-10 px-5 font-sans">
      {/* Back link */}
      <div className="w-full max-w-[540px] mb-6">
        <Link
          to="/games"
          className="text-lg text-gray-500 hover:text-gray-900 transition-colors border p-[10px] rounded-xl"
        >
          Back to Games
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-7xl font-bold mb-6" style={{ color: "#776e65" }}>
        2048
      </h1>

      {/* Score + New Game */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="flex flex-col items-center rounded-lg px-6 py-3"
          style={{ background: "#bbada0", color: "#fff" }}
        >
          <span className="text-[0.85rem] font-bold tracking-widest">SCORE</span>
          <span className="text-3xl font-bold">{score}</span>
        </div>
        <button
          onClick={resetGame}
          className="px-6 py-3 rounded-lg text-white font-bold text-lg cursor-pointer transition-colors"
          style={{ background: "#8f7a66" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#7a6859")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#8f7a66")}
        >
          New Game
        </button>
      </div>

      {/* Hint */}
      <p className="text-base mt-2 mb-6" style={{ color: "#aaa" }}>
        Use arrow keys to move tiles
      </p>

      {/* Game Over message */}
      {gameOver && (
        <p className="text-3xl font-bold mb-4" style={{ color: "#f65e3b" }}>
          Game Over!
        </p>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 120px)",
          gap: "12px",
          background: "#bbada0",
          padding: "12px",
          borderRadius: "12px",
        }}
      >
        {grid.map((cell, index) => (
          <div
            key={index}
            style={{
              width: "120px",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              backgroundColor: TILE_COLORS[cell] ?? "#3c3a32",
              color: cell <= 4 ? "#776e65" : "#f9f6f2",
            }}
          >
            <span style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
              {cell !== 0 ? cell : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game2048;

