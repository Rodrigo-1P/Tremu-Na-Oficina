/**
 * Heuristic ASL alphabet classifier from 21 MediaPipe hand landmarks.
 *
 * Landmark indices (MediaPipe Hands):
 *   0  WRIST
 *   1-4   THUMB  (CMC, MCP, IP, TIP)
 *   5-8   INDEX  (MCP, PIP, DIP, TIP)
 *   9-12  MIDDLE (MCP, PIP, DIP, TIP)
 *   13-16 RING   (MCP, PIP, DIP, TIP)
 *   17-20 PINKY  (MCP, PIP, DIP, TIP)
 */
 
const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const PIP = { thumb: 3, index: 6, middle: 10, ring: 14, pinky: 18 };
const MCP = { thumb: 2, index: 5, middle: 9, ring: 13, pinky: 17 };
 
const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
 
function fingerStates(lm) {
  const palm = dist(lm[0], lm[9]); // wrist -> middle MCP
 
  const ext = (tipIdx, pipIdx, mcpIdx) => {
    const tipToMcp = dist(lm[tipIdx], lm[mcpIdx]);
    const pipToMcp = dist(lm[pipIdx], lm[mcpIdx]);
    return tipToMcp > pipToMcp * 1.1 && tipToMcp > palm * 0.5;
  };
 
  // How "curled" a finger is: ratio of tip-to-MCP vs palm size.
  // < 0.5 = tightly curled, 0.5-0.8 = semi-curled, > 0.8 = extended
  const curlRatio = (tipIdx, mcpIdx) => dist(lm[tipIdx], lm[mcpIdx]) / palm;
 
  return {
    thumbExt: dist(lm[TIP.thumb], lm[MCP.index]) > palm * 0.5,
    indexExt: ext(TIP.index, PIP.index, MCP.index),
    middleExt: ext(TIP.middle, PIP.middle, MCP.middle),
    ringExt: ext(TIP.ring, PIP.ring, MCP.ring),
    pinkyExt: ext(TIP.pinky, PIP.pinky, MCP.pinky),
    // curl ratios (0 = fully curled, 1+ = extended)
    indexCurl: curlRatio(TIP.index, MCP.index),
    middleCurl: curlRatio(TIP.middle, MCP.middle),
    ringCurl: curlRatio(TIP.ring, MCP.ring),
    pinkyCurl: curlRatio(TIP.pinky, MCP.pinky),
    palm,
  };
}
 
// ── O ────────────────────────────────────────────────────────────────────────
// All fingertips cluster near the thumb tip forming a round aperture.
// Key: index-thumb distance is small; other fingers curve alongside.
function detectO(lm, palm) {
  const tt = lm[TIP.thumb];
  const dIdx   = dist(lm[TIP.index],  tt) / palm;
  const dMid   = dist(lm[TIP.middle], tt) / palm;
  const dRing  = dist(lm[TIP.ring],   tt) / palm;
  const dPinky = dist(lm[TIP.pinky],  tt) / palm;
 
  if (dIdx > 0.55 || dMid > 0.80 || dRing > 0.95 || dPinky > 1.10) return false;
 
  // Fingers must be curved (tips not above their own PIPs)
  const idxCurved  = lm[TIP.index].y  >= lm[PIP.index].y  - 0.03;
  const midCurved  = lm[TIP.middle].y >= lm[PIP.middle].y - 0.03;
  if (!idxCurved || !midCurved) return false;
 
  // Thumb must be somewhat away from wrist (not flat fist)
  if (dist(tt, lm[0]) / palm < 0.5) return false;
 
  return true;
}
 
// ── C ────────────────────────────────────────────────────────────────────────
// Fingers semi-curled forming a "C", thumb opposite and away.
// Key distinction from O: thumb and index tips are FAR apart (open gap).
// Key distinction from B: fingers are NOT straight.
// Key distinction from E/S/A: fingers are not tightly curled into fist.
function detectC(lm, palm, f) {
  const tt = lm[TIP.thumb];
  const it = lm[TIP.index];
 
  // Thumb and index should be well apart (the open mouth of the C)
  const thumbIndexGap = dist(tt, it) / palm;
  if (thumbIndexGap < 0.50) return false; // too close → O or fist
 
  // Fingers should be semi-curled: not fully extended, not tightly curled
  // curlRatio between ~0.55 and ~1.0 means the finger bends partway
  const idxSemi   = f.indexCurl  > 0.50 && f.indexCurl  < 1.05;
  const midSemi   = f.middleCurl > 0.50 && f.middleCurl < 1.05;
  const ringSemi  = f.ringCurl   > 0.45 && f.ringCurl   < 1.05;
  const pinkySemi = f.pinkyCurl  > 0.40 && f.pinkyCurl  < 1.05;
 
  if (!idxSemi || !midSemi || !ringSemi || !pinkySemi) return false;
 
  // Thumb should also be extended outward (not tucked)
  if (!f.thumbExt) return false;
 
  // All four fingertips should be somewhat close together (curved arc)
  const fingerSpread =
    dist(lm[TIP.index], lm[TIP.pinky]) / palm;
  if (fingerSpread > 0.90) return false; // too spread → open hand
 
  return true;
}
 
// ── S ────────────────────────────────────────────────────────────────────────
// Fist with thumb wrapped ACROSS (in front of) the fingers.
// Key: thumb tip is close to the finger DIP/PIP level in z (in front),
// and close to the middle of the hand in x.
// We detect via: all fingers curled + thumb tip is forward (negative z)
// relative to the knuckles, OR thumb tip is near the index-to-ring PIP band.
function detectS(lm, palm) {
  const tt = lm[TIP.thumb];
 
  // All four fingers must be tightly curled
  const idxCurl   = dist(lm[TIP.index],  lm[MCP.index])  / palm < 0.60;
  const midCurl   = dist(lm[TIP.middle], lm[MCP.middle]) / palm < 0.60;
  const ringCurl  = dist(lm[TIP.ring],   lm[MCP.ring])   / palm < 0.60;
  const pinkyCurl = dist(lm[TIP.pinky],  lm[MCP.pinky])  / palm < 0.65;
  if (!idxCurl || !midCurl || !ringCurl || !pinkyCurl) return false;
 
  // Thumb must NOT be above the index MCP (that would be A)
  // A: thumb tip is clearly ABOVE (lower y value) the fist
  // S: thumb tip is at roughly the same height as the PIPs or lower
  const thumbAboveFist = tt.y < lm[MCP.index].y - palm * 0.15;
  if (thumbAboveFist) return false;
 
  // Thumb tip should be in front of (lower z than) the finger PIPs
  // MediaPipe z: closer to camera = more negative
  const zAdvantage =
    (tt.z || 0) < (lm[PIP.index].z || 0) + 0.02;
 
  // Also check thumb tip is near the horizontal band of the fingers
  // (not poking out between index/middle like T)
  const thumbBetweenIndexMiddle =
    Math.abs(tt.x - lm[PIP.index].x) < palm * 0.20 &&
    Math.abs(tt.y - lm[PIP.index].y) < palm * 0.25;
  if (thumbBetweenIndexMiddle) return false; // that's T
 
  // Thumb tip should be generally near the front of the knuckles
  const thumbNearFront =
    dist(tt, lm[PIP.middle]) / palm < 0.55 ||
    dist(tt, lm[PIP.index])  / palm < 0.55 ||
    zAdvantage;
 
  return thumbNearFront;
}
 
// ── E ────────────────────────────────────────────────────────────────────────
// Fingers curled downward with tips touching or near the base of the fingers,
// thumb tucked below (under the fingers). Unlike S, the thumb is NOT in front.
// Unlike A, all fingers are curled (not just closing into a fist).
function detectE(lm, palm) {
  // All fingers must be curled — tips close to their own MCPs
  const idxCurl   = dist(lm[TIP.index],  lm[MCP.index])  / palm < 0.65;
  const midCurl   = dist(lm[TIP.middle], lm[MCP.middle]) / palm < 0.65;
  const ringCurl  = dist(lm[TIP.ring],   lm[MCP.ring])   / palm < 0.65;
  const pinkyCurl = dist(lm[TIP.pinky],  lm[MCP.pinky])  / palm < 0.70;
  if (!idxCurl || !midCurl || !ringCurl || !pinkyCurl) return false;
 
  // Thumb must be tucked BELOW the fingers (y > index MCP y, i.e. lower on screen)
  // In MediaPipe screen coords: y increases downward
  const tt = lm[TIP.thumb];
  const thumbBelowOrAt = tt.y >= lm[MCP.index].y - palm * 0.10;
  if (!thumbBelowOrAt) return false;
 
  // Thumb tip should NOT be in front of fingers (that would be S)
  // Thumb z should not be significantly less than the PIPs
  const thumbInFront = (tt.z || 0) < (lm[PIP.index].z || 0) - 0.05;
  if (thumbInFront) return false;
 
  // Fingertips should be near the palm/MCP line (curled under)
  // index tip should be close to the index PIP or below it in y
  const tipsNearPalm =
    lm[TIP.index].y >= lm[PIP.index].y - palm * 0.15;
 
  return tipsNearPalm;
}
 
// ── A ────────────────────────────────────────────────────────────────────────
// Fist with thumb alongside (not across), thumb tip pointing upward.
function detectA(lm, palm) {
  const tt = lm[TIP.thumb];
 
  // All fingers curled
  const idxCurl   = dist(lm[TIP.index],  lm[MCP.index])  / palm < 0.65;
  const midCurl   = dist(lm[TIP.middle], lm[MCP.middle]) / palm < 0.65;
  const ringCurl  = dist(lm[TIP.ring],   lm[MCP.ring])   / palm < 0.65;
  const pinkyCurl = dist(lm[TIP.pinky],  lm[MCP.pinky])  / palm < 0.70;
  if (!idxCurl || !midCurl || !ringCurl || !pinkyCurl) return false;
 
  // Thumb tip is clearly ABOVE the fist (smaller y = higher on screen)
  const thumbClearlyAbove = tt.y < lm[MCP.index].y - palm * 0.10;
  return thumbClearlyAbove;
}
 
/**
 * Main classifier. Returns letter or null.
 */
export function classifyLetter(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const lm = landmarks;
  const f = fingerStates(lm);
  const { thumbExt, indexExt, middleExt, ringExt, pinkyExt, palm } = f;
 
  const tipDist = (a, b) => dist(lm[TIP[a]], lm[TIP[b]]) / palm;
  const thumbTip  = lm[TIP.thumb];
  const indexTip  = lm[TIP.index];
 
  // ── O ──────────────────────────────────────────────────────────────────────
  if (detectO(lm, palm)) return "O";
 
  // ── C ──────────────────────────────────────────────────────────────────────
  if (detectC(lm, palm, f)) return "C";
 
  // ── S ──────────────────────────────────────────────────────────────────────
  if (detectS(lm, palm)) return "S";
 
  // ── E ──────────────────────────────────────────────────────────────────────
  if (detectE(lm, palm)) return "E";
 
  // ── A ──────────────────────────────────────────────────────────────────────
  if (detectA(lm, palm)) return "A";
 
  // ── L: thumb + index extended ──────────────────────────────────────────────
  if (thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) return "L";
 
  // ── Y: thumb + pinky extended ──────────────────────────────────────────────
  if (thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) return "Y";
 
  // ── I: only pinky extended ─────────────────────────────────────────────────
  if (!thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) return "I";
 
  // ── D: only index extended ─────────────────────────────────────────────────
  if (indexExt && !middleExt && !ringExt && !pinkyExt) return "D";
 
  // ── K: index + middle + thumb ──────────────────────────────────────────────
  if (thumbExt && indexExt && middleExt && !ringExt && !pinkyExt) return "K";
 
  // ── U / V: index + middle extended ─────────────────────────────────────────
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return tipDist("index", "middle") < 0.30 ? "U" : "V";
  }
 
  // ── W: index + middle + ring extended ──────────────────────────────────────
  if (indexExt && middleExt && ringExt && !pinkyExt) return "W";
 
  // ── B: four (or five) fingers extended ─────────────────────────────────────
  if (indexExt && middleExt && ringExt && pinkyExt) return "B";
 
  // ── F: index curled to thumb, others extended ──────────────────────────────
  if (!indexExt && middleExt && ringExt && pinkyExt) {
    if (dist(thumbTip, indexTip) / palm < 0.40) return "F";
  }
 
  // ── T: thumb between index and middle PIPs ─────────────────────────────────
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    const tx = thumbTip.x, ty = thumbTip.y;
    const between =
      ((tx > lm[PIP.index].x && tx < lm[PIP.middle].x) ||
       (tx < lm[PIP.index].x && tx > lm[PIP.middle].x)) &&
      ty < lm[PIP.index].y + 0.05;
    if (between) return "T";
  }
 
  return null;
}
 
/**
 * Confidence-stabilised classifier using majority vote.
 * Allows re-detecting the same letter after the hand is absent briefly.
 */
export class StableClassifier {
  constructor(minFrames = 7, majorityThreshold = 0.70) {
    this.buf = [];
    this.minFrames = minFrames;
    this.majorityThreshold = majorityThreshold;
    this.nullCount = 0;
    this.lastEmitted = null;
    this.emitCooldown = 0;
  }
 
  push(letter) {
    if (letter === null) {
      this.nullCount++;
      if (this.nullCount >= 5) {
        this.lastEmitted = null;
        this.buf = [];
      }
    } else {
      this.nullCount = 0;
    }
 
    this.buf.push(letter);
    if (this.buf.length > this.minFrames * 2) this.buf.shift();
 
    if (this.emitCooldown > 0) {
      this.emitCooldown--;
      return null;
    }
 
    if (this.buf.length < this.minFrames) return null;
 
    const tail = this.buf.slice(-this.minFrames);
    const counts = {};
    for (const l of tail) {
      if (l === null) continue;
      counts[l] = (counts[l] || 0) + 1;
    }
 
    let best = null, bestCount = 0;
    for (const [l, c] of Object.entries(counts)) {
      if (c > bestCount) { best = l; bestCount = c; }
    }
 
    if (!best) return null;
 
    if (bestCount / this.minFrames >= this.majorityThreshold) {
      if (best !== this.lastEmitted) {
        this.lastEmitted = best;
        this.emitCooldown = this.minFrames;
        return best;
      }
    }
 
    return null;
  }
 
  reset() {
    this.buf = [];
    this.nullCount = 0;
    this.lastEmitted = null;
    this.emitCooldown = 0;
  }
}