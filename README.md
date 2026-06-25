# TREMU NA OFICINA

Jogo de inserção social (Trabalho Prático) — soletra palavras de **4 letras** com o **alfabeto gestual ASL** em frente à webcam.

- ✅ **Stand-alone**: corre 100% no browser, sem servidores e sem APIs externas.
- ✅ **Stack**: React + JavaScript (cumpre a regra do enunciado).
- ✅ **Modelo local**: MediaPipe HandLandmarker (`hand_landmarker.task`) + WASM servidos a partir de `/public`.
- ✅ **Classificador de letras**: heurístico, baseado nos 21 landmarks da mão (sem necessidade de treinar nada).

---

## 🚀 Setup no Codespace

```bash
yarn install      # ou: npm install
yarn start        # ou: npm start
```

Abre `http://localhost:3000` (ou o URL público do Codespace) e dá **permissão à câmara**.

> Dica Codespaces: certifica-te que o porto **3000** está como **Public** (separador “Ports”) e que abres o URL via **HTTPS** — getUserMedia só funciona em contexto seguro.

---

## 🗂️ Estrutura

```
frontend/
├── public/
│   ├── index.html
│   ├── models/hand_landmarker.task     ← modelo MediaPipe (7.8 MB)
│   └── wasm/                            ← WASM runtime do MediaPipe
├── src/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   ├── index.css
│   ├── components/
│   │   ├── Home.jsx
│   │   ├── Game.jsx
│   │   └── SignCam.jsx
│   └── lib/
│       ├── handDetector.js              ← inicializa o HandLandmarker
│       ├── aslClassifier.js             ← regras heurísticas para A-Y (sem J/Z)
│       ├── letterHints.js               ← descrições PT de cada gesto
│       └── words.js                     ← lista de palavras de 4 letras
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── craco.config.js
```

---

## 🎮 Como jogar

1. Clica em **LIGAR A MÁQUINA** na homepage.
2. É escolhida aleatoriamente uma palavra de 4 letras (ex: `CASA`).
3. A app mostra a **letra alvo** + dica em português.
4. Faz o **gesto ASL** dessa letra com a mão à frente da câmara.
5. Quando o classificador confirma o gesto durante ~10 frames seguidos, a letra acende e avança para a próxima.
6. Completa a palavra → +100 pontos → próxima.

Botões disponíveis: **Pausa**, **Saltar letra**, e um **manual do alfabeto** (cola-cola da oficina) com a descrição de cada sinal.

---

## 🧠 Como funciona o reconhecimento

1. `@mediapipe/tasks-vision` (`HandLandmarker`) corre em **GPU/WASM** dentro do browser e devolve, por frame de vídeo, **21 pontos 3D** da mão.
2. `aslClassifier.js` aplica regras simples sobre esses pontos:
   - distâncias *tip→MCP* vs *PIP→MCP* decidem se cada dedo está esticado;
   - posições relativas do polegar identificam letras de **punho fechado** (A, S, T, E, O);
   - combinações de dedos esticados dão **L, Y, I, U, V, W, B, D, F, K, C**, etc.
3. Um `StableClassifier` exige que a mesma letra apareça em **N frames consecutivos** antes de a aceitar, evitando flicker.

Letras suportadas com confiança: **A B C D E F I K L O S T U V W Y** (16). As letras dinâmicas (**J, Z**) ou demasiado parecidas em 2D (**G, H, M, N, P, Q, R, X**) estão fora do MVP — a lista de palavras já garante que só aparecem letras suportadas.

---

## 🛠️ Extensões fáceis

- Mais palavras: editar `src/lib/words.js`.
- Adicionar letras: implementar mais regras em `src/lib/aslClassifier.js`.
- Treinar um classificador ML real: gravar exemplos dos 21 landmarks e treinar um pequeno MLP em TensorFlow.js (carrega como `.json` em `/public/models`).
- Modo multi-jogador local: timer + pontuação acumulada.

Boa oficina! 🔧
