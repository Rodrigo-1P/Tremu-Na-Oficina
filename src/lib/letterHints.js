// ASL letter reference – short hint text per letter (in Portuguese)
export const LETTER_HINTS = {
  A: "Punho fechado, polegar ao lado dos dedos (a apontar para cima).",
  B: "Mão aberta, 4 dedos juntos a apontar para cima, polegar dobrado sobre a palma.",
  C: "Mão curvada em forma de 'C', polegar e dedos paralelos.",
  D: "Indicador esticado para cima, polegar toca os outros dedos formando círculo.",
  E: "Todos os dedos curvados para baixo, polegar à frente.",
  F: "Polegar e indicador formam círculo; restantes 3 dedos esticados para cima.",
  G: "Indicador e polegar paralelos, horizontais. (avançado)",
  H: "Indicador e médio juntos, esticados na horizontal. (avançado)",
  I: "Apenas o mindinho esticado para cima.",
  K: "Indicador para cima, médio para o lado, polegar entre eles.",
  L: "Indicador para cima + polegar esticado em ângulo recto (forma 'L').",
  M: "Polegar por baixo de 3 dedos dobrados. (avançado)",
  N: "Polegar por baixo de 2 dedos dobrados. (avançado)",
  O: "Todos os dedos curvados a tocar o polegar formando um 'O'.",
  P: "Como K mas apontado para baixo. (avançado)",
  Q: "Como G mas apontado para baixo. (avançado)",
  R: "Indicador e médio cruzados. (avançado)",
  S: "Punho fechado, polegar à frente dos dedos.",
  T: "Punho fechado, polegar entre indicador e médio.",
  U: "Indicador e médio esticados e juntos.",
  V: "Indicador e médio esticados e separados (sinal de paz).",
  W: "Indicador, médio e anelar esticados.",
  X: "Indicador dobrado em gancho. (avançado)",
  Y: "Polegar + mindinho esticados ('hang loose').",
};

// Letters our classifier can reliably detect
export const SUPPORTED_LETTERS = new Set([
  "A", "B", "C", "D", "E", "F", "I", "K", "L", "O",
  "S", "T", "U", "V", "W", "Y",
]);

// Real reference images (American Sign Language alphabet) from Wikimedia Commons.
// Public-domain images. The Special:FilePath endpoint redirects to a sized PNG.
const wikiSign = (letter) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/Sign_language_${letter}.svg?width=320`;

export const LETTER_IMAGES = Object.fromEntries(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => [l, wikiSign(l)])
);
