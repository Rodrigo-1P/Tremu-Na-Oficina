import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import SignCam from "@/components/SignCam";
import { randomWord } from "@/lib/words";
import { LETTER_HINTS, LETTER_IMAGES, SUPPORTED_LETTERS } from "@/lib/letterHints";
 
const MAX_HINTS = 3; // 0 = nenhuma, 1 = imagem, 2 = texto, 3 = revela letra
 
export default function Game() {
  const [word, setWord] = useState(() => randomWord());
  const [idx, setIdx] = useState(0);
  const [candidate, setCandidate] = useState(null);
  const [solvedAt, setSolvedAt] = useState(null);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0); // dicas pedidas para a letra atual
  const [wrongFlash, setWrongFlash] = useState(false); // feedback visual de erro
  const lockRef = useRef(false);
 
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
    setHintsUsed(0);
    lockRef.current = false;
  }, [pickWord]);
 
  useEffect(() => {
    setWord(pickWord());
  }, [pickWord]);
 
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(t);
  }, [startedAt]);
 
  const targetLetter = word[idx];
 
  const handleLetter = useCallback(
    (letter) => {
      if (lockRef.current) return;
 
      if (letter === targetLetter) {
        // Acerto!
        lockRef.current = true;
        setTimeout(() => {
          if (idx + 1 >= word.length) {
            setSolvedAt(Date.now());
            // Pontuação: 100 base, menos 10 por cada dica usada
            setScore((s) => s + Math.max(100 - hintsUsed * 10, 10));
          } else {
            setIdx((i) => i + 1);
            setHintsUsed(0);
            lockRef.current = false;
          }
        }, 400);
      } else if (letter !== null) {
        // Erro: flash vermelho mas não penaliza automaticamente
        setWrongFlash(true);
        setTimeout(() => setWrongFlash(false), 500);
      }
    },
    [targetLetter, idx, word.length, hintsUsed]
  );
 
  const requestHint = () => {
    if (hintsUsed < MAX_HINTS) {
      setHintsUsed((h) => h + 1);
    }
  };
 
  const skipLetter = () => {
    if (idx + 1 >= word.length) {
      setSolvedAt(Date.now());
    } else {
      setIdx((i) => i + 1);
      setHintsUsed(0);
      lockRef.current = false;
    }
  };
 
  const supportedHints = useMemo(
    () => Object.entries(LETTER_HINTS).filter(([k]) => SUPPORTED_LETTERS.has(k)),
    []
  );
 
  // Hint content based on how many hints used
  const showImage = hintsUsed >= 1;
  const showText  = hintsUsed >= 2;
  const showLetter = hintsUsed >= 3;
 
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
            <div className={`rounded-lg transition-all duration-150 ${wrongFlash ? "ring-4 ring-red-500" : ""}`}>
              <SignCam
                onLetter={handleLetter}
                onCandidate={setCandidate}
                paused={paused || !!solvedAt}
              />
            </div>
 
            {/* Hint panel — só aparece se o jogador pediu dicas */}
            {!solvedAt && hintsUsed > 0 && (
              <div
                className="mt-4 bg-zinc-900 border-2 border-amber-500/40 rounded-lg p-4 flex items-center gap-4"
                data-testid="letter-reference"
              >
                {showImage && LETTER_IMAGES[targetLetter] && (
                  <img
                    src={LETTER_IMAGES[targetLetter]}
                    alt="Gesto da letra"
                    className="w-24 h-24 object-contain bg-white rounded-md p-2 shrink-0"
                    data-testid="letter-reference-img"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-1">
                    {showLetter ? "Letra revelada" : showText ? "Dica 2/3 — descrição" : "Dica 1/3 — gesto"}
                  </p>
                  {showLetter && (
                    <p className="font-display text-5xl font-black text-amber-300 leading-none">
                      {targetLetter}
                    </p>
                  )}
                  {showText && (
                    <p className="font-mono text-xs text-zinc-300 mt-1">
                      {LETTER_HINTS[targetLetter] || "—"}
                    </p>
                  )}
                  {!showText && (
                    <p className="font-mono text-xs text-zinc-400 mt-1">
                      Imita o gesto da imagem com a tua mão.
                    </p>
                  )}
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
 
              {/* Word display — letra atual mostra ? até ser descoberta */}
              <div className="flex justify-center gap-3 mb-6" data-testid="word-display">
                {[...word].map((c, i) => {
                  const done = i < idx || !!solvedAt;
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
                      {done ? c : active ? "?" : "·"}
                    </div>
                  );
                })}
              </div>
 
              {solvedAt ? (
                <div className="text-center" data-testid="game-solved">
                  <p className="font-display text-3xl text-amber-300 mb-1">PALAVRA COMPLETA!</p>
                  <p className="font-mono text-sm text-zinc-400 mb-4">
                    +{Math.max(100 - (hintsUsed * 10), 10)} pontos
                  </p>
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
                  <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-4">
                    Faz o gesto da letra com a mão
                  </p>
 
                  {/* Hint button — mostra quantas dicas já foram usadas */}
                  <button
                    onClick={requestHint}
                    disabled={hintsUsed >= MAX_HINTS}
                    className={`px-4 py-2 rounded font-mono text-sm uppercase tracking-wider border transition-all
                      ${hintsUsed >= MAX_HINTS
                        ? "border-zinc-700 text-zinc-600 cursor-not-allowed"
                        : "border-amber-500/60 text-amber-400 hover:bg-amber-500/10"
                      }`}
                    data-testid="game-hint-btn"
                  >
                    {hintsUsed === 0 && "💡 Pedir dica"}
                    {hintsUsed === 1 && "💡 Mais uma dica (−10 pts)"}
                    {hintsUsed === 2 && "💡 Revelar letra (−10 pts)"}
                    {hintsUsed >= 3 && "Sem mais dicas"}
                  </button>
 
                  {/* Hint counter dots */}
                  <div className="flex justify-center gap-2 mt-3">
                    {Array.from({ length: MAX_HINTS }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i < hintsUsed ? "bg-amber-400" : "bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
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