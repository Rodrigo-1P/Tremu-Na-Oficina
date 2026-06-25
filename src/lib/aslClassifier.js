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
 *
 * Static signs only (no J, no Z). Returns single uppercase letter or null.
 *
 * Notes on robustness: we work in a wrist-relative, scale-normalised
 * coordinate frame. Finger "extended" / "curled" is decided by tip-to-MCP
 * distance vs PIP-to-MCP distance, which is rotation-invariant.
 */

const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const PIP = { thumb: 3, index: 6, middle: 10, ring: 14, pinky: 18 };
const MCP = { thumb: 2, index: 5, middle: 9, ring: 13, pinky: 17 };

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));

/**
 * Returns booleans for whether each finger is extended.
 * A finger is "extended" when the tip is further from MCP than the PIP is
 * (with a small margin), and that distance is large relative to palm size.
 */
function fingerStates(lm) {
  const palm = dist(lm[0], lm[9]); // wrist -> middle MCP, used as palm scale
  const ext = (tipIdx, pipIdx, mcpIdx) => {
    const tipToMcp = dist(lm[tipIdx], lm[mcpIdx]);
    const pipToMcp = dist(lm[pipIdx], lm[mcpIdx]);
    return tipToMcp > pipToMcp * 1.15 && tipToMcp > palm * 0.55;
  };
  return {
    thumbExt: dist(lm[TIP.thumb], lm[MCP.index]) > palm * 0.55, // thumb away from index base
    indexExt: ext(TIP.index, PIP.index, MCP.index),
    middleExt: ext(TIP.middle, PIP.middle, MCP.middle),
    ringExt: ext(TIP.ring, PIP.ring, MCP.ring),
    pinkyExt: ext(TIP.pinky, PIP.pinky, MCP.pinky),
    palm,
  };
}

/**
 * Main classifier. Returns letter or null.
 */
export function classifyLetter(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const lm = landmarks;
  const f = fingerStates(lm);
  const { thumbExt, indexExt, middleExt, ringExt, pinkyExt, palm } = f;

  // Helpers
  const tipDist = (a, b) => dist(lm[TIP[a]], lm[TIP[b]]) / palm;
  const thumbTip = lm[TIP.thumb];
  const indexTip = lm[TIP.index];
  const middleTip = lm[TIP.middle];
  const ringTip = lm[TIP.ring];
  const pinkyTip = lm[TIP.pinky];

  const fingersUp = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean)
    .length;

  // L: thumb + index extended, others curled, thumb perpendicular to index
  if (thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) {
    return "L";
  }

  // Y: thumb + pinky extended, middle three curled
  if (thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) {
    return "Y";
  }

  // I: only pinky extended
  if (!thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) {
    return "I";
  }

  // D: only index extended, thumb touches middle finger tip (curled)
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    const thumbTouchMid = dist(thumbTip, lm[TIP.middle]) / palm < 0.5;
    if (thumbTouchMid) return "D";
    return "D"; // index up generally → D
  }

  // U: index + middle extended together (touching), ring/pinky curled
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    const close = tipDist("index", "middle") < 0.35;
    if (close) return "U";
    // V: index + middle extended, spread apart
    return "V";
  }

  // W: index + middle + ring extended, pinky curled
  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return "W";
  }

  // B: four fingers extended straight up, thumb folded across palm
  if (indexExt && middleExt && ringExt && pinkyExt && !thumbExt) {
    return "B";
  }

  // Open hand (5 extended) — treat as B if thumb out to side too
  if (indexExt && middleExt && ringExt && pinkyExt && thumbExt) {
    return "B";
  }

  // Fist with thumb across (A) vs other closed-fist letters
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    // E: fingertips curl down toward palm, thumb tucked under fingers.
    // S: thumb crosses over front of fingers (thumb tip near index PIP).
    // A: thumb alongside index, sticking up next to fist.
    // O: all fingertips touch thumb tip (round shape).
    // M: thumb tucked under three fingers (index/middle/ring tips near thumb base)
    // N: thumb tucked under two fingers
    // T: thumb between index and middle

    const allTipsToThumb =
      (dist(indexTip, thumbTip) +
        dist(middleTip, thumbTip) +
        dist(ringTip, thumbTip) +
        dist(pinkyTip, thumbTip)) /
      (4 * palm);

    if (allTipsToThumb < 0.55) {
      return "O";
    }

    // Thumb position relative to index finger
    const thumbAboveIndexMcp = thumbTip.y < lm[MCP.index].y; // thumb tip higher than index base
    const thumbBesideFist =
      thumbTip.x < lm[MCP.index].x && thumbAboveIndexMcp; // (mirrored cam) - either side fine

    // T: thumb tip between index and middle PIPs
    const tx = thumbTip.x,
      ty = thumbTip.y;
    const between =
      ((tx > lm[PIP.index].x && tx < lm[PIP.middle].x) ||
        (tx < lm[PIP.index].x && tx > lm[PIP.middle].x)) &&
      ty < lm[PIP.index].y + 0.05;
    if (between) return "T";

    // S: thumb in front of fingers (thumb tip x between index PIP and ring PIP, y near them)
    const thumbAcross =
      ((tx > lm[PIP.index].x && tx < lm[PIP.ring].x) ||
        (tx < lm[PIP.index].x && tx > lm[PIP.ring].x)) &&
      Math.abs(ty - lm[PIP.middle].y) < palm * 0.4;
    if (thumbAcross) return "S";

    // A: thumb pointing up alongside the fist
    if (thumbAboveIndexMcp) return "A";

    // Fallback for closed fist
    return "E";
  }

  // M / N: thumb tucked under bent fingers, index+middle (+ring for M) bend down
  // Hard to detect reliably with static heuristics; we approximate:
  // If no fingers "extended" but tips are forward (z negative) more than usual,
  // skip (handled above). Otherwise fall through.

  // R: index + middle extended and crossed (middle tip x near index tip x)
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    // already returned above as U/V; R is rare to detect without crossing data
  }

  // K: index up, middle up & spread, thumb between them (similar to V with thumb)
  if (indexExt && middleExt && !ringExt && !pinkyExt && thumbExt) {
    return "K";
  }

  // F: index + thumb form circle, other three extended
  if (!indexExt && middleExt && ringExt && pinkyExt) {
    const circle = dist(thumbTip, indexTip) / palm < 0.35;
    if (circle) return "F";
  }

  // C: hand curved like a C — fingers slightly curled, thumb opposite
  // Approximate: no finger fully extended, but tips are far from MCPs (slight curl)
  // and thumb tip far from index tip.
  if (fingersUp <= 1) {
    const curveScore =
      dist(lm[TIP.index], lm[MCP.index]) / palm +
      dist(lm[TIP.middle], lm[MCP.middle]) / palm;
    if (curveScore > 1.2 && curveScore < 2.0 && dist(thumbTip, indexTip) / palm > 0.5) {
      return "C";
    }
  }

  // G: index pointing sideways, thumb parallel - approximate with index extended horizontally
  // H: index + middle pointing sideways
  // These rely on hand orientation which is harder; we leave as null.

  // P: similar to K but pointed down — skip
  // Q: similar to G but pointed down — skip
  // X: index finger bent (hook). Index PIP-MCP roughly equal to TIP-MCP
  if (!indexExt && !middleExt && !ringExt && !pinkyExt === false) {
    // unreachable safety
  }

  // Final fallback
  return null;
}

/**
 * A confidence-stabilised classifier. Maintains a small rolling buffer and
 * returns a letter only after it has been the top candidate for `minFrames`
 * consecutive frames.
 */
export class StableClassifier {
  constructor(minFrames = 8) {
    this.buf = [];
    this.minFrames = minFrames;
  }
  push(letter) {
    this.buf.push(letter);
    if (this.buf.length > this.minFrames * 2) this.buf.shift();
    if (this.buf.length < this.minFrames) return null;
    const tail = this.buf.slice(-this.minFrames);
    const first = tail[0];
    if (first && tail.every((x) => x === first)) return first;
    return null;
  }
  reset() {
    this.buf = [];
  }
}
