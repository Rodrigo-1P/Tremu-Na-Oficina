import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Diagonal hazard stripes background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fbbf24 0 24px, transparent 24px 48px)",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #71717a 1px, transparent 1px), linear-gradient(to bottom, #71717a 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Brand strip */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-amber-500 flex items-center justify-center font-display text-zinc-950 text-xl font-black rounded">
            T
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
            EST. 2026 · OFICINA DE GESTOS
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-display font-black leading-[0.85] tracking-tight text-amber-400 mb-6"
          style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
          data-testid="home-title"
        >
          TREMU
          <br />
          <span className="text-zinc-100">NA OFICINA</span>
        </h1>

        <p className="max-w-2xl font-mono text-base md:text-lg text-zinc-400 mb-10 leading-relaxed" data-testid="home-tagline">
          Soletra palavras de quatro letras usando o{" "}
          <span className="text-amber-300">alfabeto gestual ASL</span> em frente
          à câmara. Sem servidores, sem cloud — o modelo de visão corre todo
          dentro do teu navegador.
        </p>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 mb-12">
          {[
            ["100%", "Stand-alone"],
            ["21", "Pontos da mão"],
            ["4", "Letras por palavra"],
            ["16+", "Letras suportadas"],
          ].map(([n, l]) => (
            <div key={l} className="bg-zinc-950 p-4">
              <div className="font-display text-3xl text-amber-400 font-bold">{n}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
                {l}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-4 items-center">
          <Link
            to="/game"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-display text-xl font-black tracking-wider rounded transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_0_0_#92400e]"
            data-testid="home-start-btn"
          >
            <span>LIGAR A MÁQUINA</span>
            <span className="transition-transform group-hover:translate-x-1">▶</span>
          </Link>
          <a
            href="#instrucoes"
            className="font-mono text-sm uppercase tracking-widest text-zinc-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-500/40"
            data-testid="home-instructions-link"
          >
            Manual de operação
          </a>
        </div>

        {/* Instructions */}
        <section id="instrucoes" className="mt-24 grid md:grid-cols-3 gap-px bg-zinc-800 border border-zinc-800">
          {[
            {
              n: "01",
              t: "Acende a câmara",
              d: "Permite o acesso à webcam. O modelo MediaPipe Hands faz tracking dos 21 pontos da tua mão em tempo real.",
            },
            {
              n: "02",
              t: "Faz o sinal",
              d: "Vê a letra alvo e a dica no painel. Imita o gesto ASL correspondente, mão de frente para a câmara.",
            },
            {
              n: "03",
              t: "Soletra a palavra",
              d: "Aguenta o gesto durante alguns frames. Quando o sistema reconhece, avança para a próxima letra.",
            },
          ].map((s) => (
            <div key={s.n} className="bg-zinc-950 p-6">
              <div className="font-display text-5xl text-amber-500/60 font-black mb-2">
                {s.n}
              </div>
              <h3 className="font-display text-xl text-amber-300 font-bold mb-2 uppercase">
                {s.t}
              </h3>
              <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                {s.d}
              </p>
            </div>
          ))}
        </section>

        <footer className="mt-16 pt-6 border-t border-zinc-800 font-mono text-[10px] uppercase tracking-widest text-zinc-600 flex justify-between">
          <span>Tremu na Oficina · v0.1.0</span>
          <span>Made with React + MediaPipe · 100% local</span>
        </footer>
      </div>
    </div>
  );
}
