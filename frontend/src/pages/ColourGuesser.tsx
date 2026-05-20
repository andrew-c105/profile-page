import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "intro" | "memorise" | "guess" | "result" | "finalResult";

const TOTAL_ROUNDS = 3;

interface HSB {
  h: number; // 0–360
  s: number; // 0–100
  b: number; // 0–100
}

// Colour helpers 
// Convert HSB -> CSS hsl() string. HSB brightness maps to HSL lightness. 
const hsbToHsl = ({ h, s, b }: HSB): { h: number; s: number; l: number } => {
  const sFrac = s / 100;
  const bFrac = b / 100;
  const l = bFrac * (1 - sFrac / 2);
  const sHsl = l === 0 || l === 1 ? 0 : (bFrac - l) / Math.min(l, 1 - l);
  return { h, s: sHsl * 100, l: l * 100 };
};

const hsbToCss = (hsb: HSB): string => {
  const { h, s, l } = hsbToHsl(hsb);
  return `hsl(${h}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
};

// Generate a random target colour 
const randomColour = (): HSB => ({
  h: Math.floor(Math.random() * 360),
  s: Math.floor(Math.random() * 61) + 40,
  b: Math.floor(Math.random() * 61) + 40,
});

// Randomise guess starting point
const randomGuess = (target: HSB): HSB => ({
  h: (target.h + 60 + Math.floor(Math.random() * 240)) % 360,
  s: Math.max(0, Math.min(100, target.s + (Math.random() > 0.5 ? 1 : -1) * (20 + Math.floor(Math.random() * 30)))),
  b: Math.max(0, Math.min(100, target.b + (Math.random() > 0.5 ? 1 : -1) * (20 + Math.floor(Math.random() * 30)))),
});

// Scoring
const calcScore = (target: HSB, guess: HSB): number => {
  const dH = Math.min(Math.abs(target.h - guess.h), 360 - Math.abs(target.h - guess.h)) / 180;
  const dS = Math.abs(target.s - guess.s) / 100;
  const dB = Math.abs(target.b - guess.b) / 100;
  const dist = 0.6 * dH + 0.2 * dS + 0.2 * dB;
  return Math.round((1 - dist) * 1000) / 100;
};

const scoreQuip = (score: number): string => {
  if (score >= 9.5) return "Nearly perfect!";
  if (score >= 9) return "Incredible!";
  if (score >= 8) return "Sharp vision!";
  if (score >= 7) return "Pretty solid!";
  if (score >= 6) return "Not bad at all.";
  if (score >= 5) return "Perfectly average.";
  if (score >= 4) return "Room for improvement.";
  if (score >= 3) return "A bit off…";
  return "Were your eyes closed?";
};

// Timer ring component
const TIMER_DURATION = 6;
const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CountdownRing = ({
  secondsLeft,
  total,
}: {
  secondsLeft: number;
  total: number;
}) => {
  const progress = secondsLeft / total;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" className="absolute inset-0 -rotate-90">
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="6"
        />
        {/* Progress */}
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className="text-white text-4xl font-bold z-10">{secondsLeft}</span>
    </div>
  );
};

// Slider styling
const sliderStyles = `
  .colour-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 12px;
    border-radius: 6px;
    outline: none;
    cursor: pointer;
  }
  .colour-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    border: 3px solid rgba(0,0,0,0.2);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: grab;
    transition: transform 0.15s ease;
  }
  .colour-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  .colour-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.05);
  }
  .colour-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    border: 3px solid rgba(0,0,0,0.2);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: grab;
  }
  .colour-slider::-moz-range-track {
    height: 12px;
    border-radius: 6px;
  }
`;

// Main component
const ColourGuesser = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [target, setTarget] = useState<HSB>(randomColour());
  const [guess, setGuess] = useState<HSB>({ h: 180, s: 50, b: 50 });
  const [secondsLeft, setSecondsLeft] = useState(TIMER_DURATION);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [roundScores, setRoundScores] = useState<number[]>([]);

  // Start a fresh game (resets rounds)
  const startGame = useCallback(() => {
    setRound(1);
    setRoundScores([]);
    const newTarget = randomColour();
    setTarget(newTarget);
    setGuess(randomGuess(newTarget));
    setSecondsLeft(TIMER_DURATION);
    setPhase("memorise");
  }, []);

  // Start the next round (keeps scores)
  const startNextRound = useCallback(() => {
    const newTarget = randomColour();
    setTarget(newTarget);
    setGuess(randomGuess(newTarget));
    setSecondsLeft(TIMER_DURATION);
    setPhase("memorise");
  }, []);

  // Timer tick
  useEffect(() => {
    if (phase !== "memorise") return;
    if (secondsLeft <= 0) {
      setPhase("guess");
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft]);

  // Submit guess
  const handleSubmit = () => {
    const roundScore = calcScore(target, guess);
    setScore(roundScore);
    setRoundScores((prev) => [...prev, roundScore]);
    setPhase("result");
  };

  // Move to next round or final result
  const handleNextRound = () => {
    if (round < TOTAL_ROUNDS) {
      setRound((r) => r + 1);
      startNextRound();
    } else {
      setPhase("finalResult");
    }
  };

  // Slider gradient builders
  const hueGradient =
    "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))";

  const satGradient = `linear-gradient(to right, ${hsbToCss({ ...guess, s: 0 })}, ${hsbToCss({ ...guess, s: 100 })})`;

  const briGradient = `linear-gradient(to right, ${hsbToCss({ ...guess, b: 0 })}, ${hsbToCss({ ...guess, b: 100 })})`;

  // Transition wrapper
  const pageVariants = {
    initial: { opacity: 0, y: 24, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -16, scale: 0.97 },
  };

  return (
    <div className="flex flex-col items-center min-h-[70vh] py-4 px-4 font-sans">
      <style>{sliderStyles}</style>

      {/* Back link — hidden during result/finalResult since there are buttons */}
      {phase !== "result" && phase !== "finalResult" && (
        <div className="w-full max-w-[768px] mb-6">
          <Link
            to="/games"
            className="text-lg text-gray-500 hover:text-gray-900 transition-colors"
          >
            Back to Games
          </Link>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* PHASE 1: INTRO */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[768px] flex flex-col items-center"
          >
            <div className="w-full rounded-2xl bg-white border border-gray-200 p-12 flex flex-col items-center gap-6 shadow-lg">

              <h1 className="text-5xl font-bold text-gray-900 tracking-tight text-center">
                Guess The Colour
              </h1>
              <p className="text-gray-500 text-center text-lg leading-relaxed max-w-lg">
                You'll be shown a random colour for{" "}
                <span className="text-gray-900 font-semibold">6 seconds</span> over 3 rounds.
                Memorise it, then recreate it using hue, saturation and
                brightness sliders. The closer your guess, the higher your
                score! Try to score as high as you possibly can!
              </p>

              <button
                onClick={startGame}
                className="mt-2 px-10 py-3.5 rounded-lg bg-gray-900 text-white font-semibold text-base cursor-pointer shadow-lg"
              >
                Start Game
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: MEMORISE */}
        {phase === "memorise" && (
          <motion.div
            key="memorise"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[768px] flex flex-col items-center gap-4"
          >
            <div
              className="w-full rounded-2xl overflow-hidden shadow-xl flex flex-col items-center justify-center relative"
              style={{
                background: hsbToCss(target),
                aspectRatio: "4 / 3",
                minHeight: 480,
              }}
            >
              {/* Subtle overlay for readability */}
              <div className="absolute inset-0 bg-black/10" />

              <div className="relative z-10 flex flex-col items-center gap-4">
                <p className="text-white/90 text-xs font-bold tracking-widest uppercase">
                  Round {round}/{TOTAL_ROUNDS}
                </p>
                <p className="text-white/70 text-sm font-medium tracking-wide uppercase">
                  Memorise this colour
                </p>
                <CountdownRing secondsLeft={secondsLeft} total={TIMER_DURATION} />
              </div>
            </div>

            <button
              onClick={() => { setPhase("intro"); setRound(1); setRoundScores([]); }}
              className="text-lg text-gray-700 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Back to Start
            </button>
          </motion.div>
        )}

        {/* PHASE 3: GUESS */}
        {phase === "guess" && (
          <motion.div
            key="guess"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[768px] flex flex-col items-center gap-5"
          >
            {/* Round indicator */}
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">
              Round {round}/{TOTAL_ROUNDS}
            </p>

            {/* Colour preview */}
            <div
              className="w-full rounded-2xl shadow-xl overflow-hidden"
              style={{
                background: hsbToCss(guess),
                aspectRatio: "16 / 9",
                minHeight: 320,
                transition: "background 0.15s ease",
              }}
            />

            {/* Sliders card */}
            <div className="w-full rounded-2xl bg-white border border-gray-200 p-8 flex flex-col gap-6 shadow-lg">
              {/* Hue */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Hue</span>
                  <span className="text-gray-900 font-semibold">{guess.h}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={guess.h}
                  onChange={(e) =>
                    setGuess((g) => ({ ...g, h: Number(e.target.value) }))
                  }
                  className="colour-slider"
                  style={{ background: hueGradient }}
                />
              </div>

              {/* Saturation */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Saturation</span>
                  <span className="text-gray-900 font-semibold">{guess.s}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={guess.s}
                  onChange={(e) =>
                    setGuess((g) => ({ ...g, s: Number(e.target.value) }))
                  }
                  className="colour-slider"
                  style={{ background: satGradient }}
                />
              </div>

              {/* Brightness */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Brightness</span>
                  <span className="text-gray-900 font-semibold">{guess.b}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={guess.b}
                  onChange={(e) =>
                    setGuess((g) => ({ ...g, b: Number(e.target.value) }))
                  }
                  className="colour-slider"
                  style={{ background: briGradient }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-[280px] py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-base cursor-pointer"
            >
              Submit Guess
            </button>

            <button
              onClick={() => { setPhase("intro"); setRound(1); setRoundScores([]); }}
              className="text-lg text-gray-700 hover:text-gray-600 transition-colors cursor-pointer w-[280px] py-3.5 rounded-xl border"
            >
              Back to Start
            </button>
          </motion.div>
        )}

        {/* PHASE 4: PER-ROUND RESULT */}
        {phase === "result" && (
          <motion.div
            key="result"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[768px] flex flex-col items-center gap-5"
          >
            {/* Round indicator */}
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">
              Round {round}/{TOTAL_ROUNDS}
            </p>

            {/* Split colour card */}
            <div className="w-full rounded-2xl overflow-hidden shadow-xl">
              {/* Your guess — top half */}
              <div
                className="relative flex flex-col justify-between p-8"
                style={{
                  background: hsbToCss(guess),
                  minHeight: 260,
                }}
              >
                <div />
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
                      Your Selection
                    </p>
                    <p className="text-white font-bold text-sm">
                      H{guess.h} S{guess.s} B{guess.b}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-extrabold text-6xl leading-none">
                      {score.toFixed(2)}
                    </p>
                    <p className="text-white/80 text-base font-medium mt-2">
                      {scoreQuip(score)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Original — bottom half */}
              <div
                className="relative flex flex-col justify-end p-8"
                style={{
                  background: hsbToCss(target),
                  minHeight: 260,
                }}
              >
                <div>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
                    Original
                  </p>
                  <p className="text-white font-bold text-sm">
                    H{target.h} S{target.s} B{target.b}
                  </p>
                </div>
              </div>
            </div>

            {/* Next round or see final score */}
            <button
              onClick={handleNextRound}
              className="w-[280px] py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-base cursor-pointer"
            >
              {round < TOTAL_ROUNDS ? `Next Round (${round + 1}/${TOTAL_ROUNDS})` : "See Final Score"}
            </button>

            <button
              onClick={() => { setPhase("intro"); setRound(1); setRoundScores([]); }}
              className="text-lg text-gray-700 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Back to Start
            </button>
          </motion.div>
        )}

        {/* PHASE 5: FINAL RESULT */}
        {phase === "finalResult" && (
          <motion.div
            key="finalResult"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[768px] flex flex-col items-center gap-5"
          >
            <div className="w-full rounded-2xl bg-white border border-gray-200 p-10 flex flex-col items-center gap-6 shadow-lg">
              <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">
                Final Score
              </p>

              <p className="text-gray-900 font-extrabold text-8xl leading-none">
                {roundScores.reduce((a, b) => a + b, 0).toFixed(2)}
              </p>
              <p className="text-gray-500 text-xl font-medium">
                out of {TOTAL_ROUNDS * 10}.00
              </p>

              {/* Per-round breakdown */}
              <div className="w-full max-w-xs flex flex-col gap-2 mt-2">
                {roundScores.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">Round {i + 1}</span>
                    <span className="text-gray-900 font-semibold">{s.toFixed(2)} / 10</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 w-[280px] rounded-xl bg-gray-900 text-white font-semibold text-sm cursor-pointer"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate("/games")}
                className="flex-1 py-3.5 w-[280px] rounded-xl bg-white text-gray-900 font-semibold text-sm border border-gray-200 cursor-pointer"
              >
                Back to Games
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColourGuesser;