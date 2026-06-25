import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarker = null;
let initPromise = null;

export async function getHandLandmarker() {
  if (landmarker) return landmarker;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks("/wasm");
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    return landmarker;
  })();

  return initPromise;
}

export function drawLandmarks(ctx, landmarks, width, height) {
  if (!landmarks) return;
  // Connections (MediaPipe Hands skeleton)
  const CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17],
  ];

  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 140, 0, 0.9)";
  ctx.beginPath();
  for (const [a, b] of CONNECTIONS) {
    const p1 = landmarks[a], p2 = landmarks[b];
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
  }
  ctx.stroke();

  ctx.fillStyle = "#fbbf24";
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
