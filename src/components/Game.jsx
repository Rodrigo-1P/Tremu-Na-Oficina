import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import SignCam from "@/components/SignCam";
import { randomWord } from "@/lib/words";
import { LETTER_HINTS, LETTER_IMAGES, SUPPORTED_LETTERS } from "@/lib/letterHints";

export default function Game() {
  const [word, setWord] = useState(() => randomWord());
  const [idx, setIdx] = useState(0);
  const [candidate, setCandidate] = useState(null);
  const [solvedAt, setSolvedAt] = useState(null);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const lockRef = useRef(false);

  // Ensure word only contains supported letters
  const pickWord = useCallback(() => {
    for (let i = 0; i < 50; i++) {
      const w = randomWord();
      if ([...w].every((c) => SUPPORTED_LETTERS.has(c))) return w;
    }
    return "CASA";
  }, []);

  const newWord = useCallback(() => {
    setWord(pickWord());
    setIdx(0);
    setSolvedAt(null);
    lockRef.current = false;
  }, [pickWord]);

  useEffect(() => {
    setWord(pickWord());
  }, [pickWord]);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(t);
  }, [startedAt]);

  const targetLetter = word[idx];

  const handleLetter = useCallback(
    (letter) => {
      if (lockRef.current) return;
      if (letter === targetLetter) {
        lockRef.current = true;
        setTimeout(() => {
          if (idx + 1 >= word.length) {
            // Word completed
            setSolvedAt(Date.now());
            setScore((s) => s + 100);
          } else {
            setIdx((i) => i + 1);
            lockRef.current = false;
          }
        }, 400);
      }
    },
    [targetLetter, idx, word.length]
  );

  const skipLetter = () => {
    if (idx + 1 >= word.length) {
      setSolvedAt(Date.now());
    } else {
      setIdx((i) => i + 1);
      lockRef.current = false;
    }
  };

  const supportedHints = useMemo(
    () => Object.entries(LETTER_HINTS).filter(([k]) => SUPPORTED_LETTERS.has(k)),
    []
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 pb-4 border-b-2 border-amber-500/40">
          <Link to="/" className="font-display text-2xl tracking-wider text-amber-400 hover:text-amber-300" data-testid="game-home-link">
            ← TREMU NA OFICINA
          </Link>
          <div className="flex items-center gap-4 font-mono text-sm">
            <span className="text-zinc-400" data-testid="game-timer">⧗ {elapsed}s</span>
            <span className="px-3 py-1 bg-amber-500 text-zinc-950 font-bold rounded" data-testid="game-score">PONTOS: {score}</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Webcam */}
          <div>
            <SignCam
              onLetter={handleLetter}
              onCandidate={setCandidate}
              paused={paused || !!solvedAt}
            />

            {/* Reference image — real photo of the target letter sign (guide) */}
            {!solvedAt && LETTER_IMAGES[targetLetter] && (
              <div
                className="mt-4 bg-zinc-900 border-2 border-amber-500/40 rounded-lg p-4 flex items-center gap-4"
                data-testid="letter-reference"
              >
                <img
                  src={LETTER_IMAGES[targetLetter]}
                  alt={`Gesto da letra ${targetLetter} em Língua Gestual Americana`}
                  className="w-28 h-28 md:w-32 md:h-32 object-contain bg-white rounded-md p-2 shrink-0"
                  data-testid="letter-reference-img"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-1">
                    Modelo a imitar
                  </p>
                  <p className="font-display text-4xl md:text-5xl font-black text-amber-300 leading-none">
                    {targetLetter}
                  </p>
                  <p className="font-mono text-xs text-zinc-400 mt-2">
                    Posiciona a mão na câmara como mostra a imagem.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between font-mono text-sm text-zinc-400">
              <span data-testid="game-candidate">
                Deteção: <span className="text-amber-300 text-lg font-bold">{candidate || "—"}</span>
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700"
                  onClick={() => setPaused((p) => !p)}
                  data-testid="game-pause-btn"
                >
                  {paused ? "Retomar" : "Pausa"}
                </button>
                <button
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700"
                  onClick={skipLetter}
                  data-testid="game-skip-btn"
                >
                  Saltar letra
                </button>
              </div>
            </div>
          </div>

          {/* Word + hint panel */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-lg p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-2">
                Palavra
              </p>
              <div className="flex justify-center gap-3 mb-6" data-testid="word-display">
                {[...word].map((c, i) => {
                  const done = i < idx || solvedAt;
                  const active = i === idx && !solvedAt;
                  return (
                    <div
                      key={i}
                      className={`w-16 h-20 md:w-20 md:h-24 flex items-center justify-center rounded-md font-display text-4xl md:text-5xl font-bold border-2 transition-all
                        ${done ? "bg-amber-500 text-zinc-950 border-amber-400" : ""}
                        ${active ? "bg-zinc-950 text-amber-300 border-amber-400 animate-pulse" : ""}
                        ${!done && !active ? "bg-zinc-800 text-zinc-600 border-zinc-700" : ""}
                      `}
                      data-testid={`word-letter-${i}`}
                    >
                      {done || active ? c : "·"}
                    </div>
                  );
                })}
              </div>

              {solvedAt ? (
                <div className="text-center" data-testid="game-solved">
                  <p className="font-display text-3xl text-amber-300 mb-1">PALAVRA COMPLETA!</p>
                  <p className="font-mono text-sm text-zinc-400 mb-4">+100 pontos</p>
                  <button
                    onClick={newWord}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded font-mono uppercase tracking-wider"
                    data-testid="game-next-word-btn"
                  >
                    Próxima palavra →
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-1">
                    Faz o gesto da letra
                  </p>
                  <p className="font-display text-7xl md:text-8xl font-black text-amber-300" data-testid="target-letter">
                    {targetLetter}
                  </p>
                  <p className="font-mono text-xs text-zinc-400 mt-3 max-w-md mx-auto" data-testid="letter-hint">
                    {LETTER_HINTS[targetLetter] || "—"}
                  </p>
                </div>
              )}
            </div>

            <details className="bg-zinc-900 border border-zinc-800 rounded-lg p-4" data-testid="alphabet-cheatsheet">
              <summary className="font-mono text-sm uppercase tracking-widest text-zinc-400 cursor-pointer hover:text-amber-300">
                Manual do alfabeto (cola para a oficina)
              </summary>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs font-mono">
                {supportedHints.map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="font-display text-xl text-amber-400 w-6">{k}</span>
                    <span className="text-zinc-400 flex-1">{v}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
