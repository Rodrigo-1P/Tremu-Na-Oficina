import React, { useEffect, useRef, useState, useCallback } from "react";
import { getHandLandmarker, drawLandmarks } from "@/lib/handDetector";
import { classifyLetter, StableClassifier } from "@/lib/aslClassifier";
 
/**
 * SignCam — opens the webcam, runs HandLandmarker per frame, draws the skeleton
 * overlay, runs the heuristic classifier and reports the stable letter via
 * `onLetter(letter)`. Also reports the live (non-stabilised) candidate via
 * `onCandidate(letter)` for instant feedback.
 */
export default function SignCam({ onLetter, onCandidate, paused = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stableRef = useRef(new StableClassifier(7, 0.70));
  const lastTimeRef = useRef(-1);
 
  const [status, setStatus] = useState("A inicializar…");
  const [error, setError] = useState(null);
 
  const loop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
 
    const landmarker = await getHandLandmarker();
    if (video.readyState >= 2 && video.currentTime !== lastTimeRef.current) {
      lastTimeRef.current = video.currentTime;
      const ts = performance.now();
      const result = landmarker.detectForVideo(video, ts);
 
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
 
      let cand = null;
      if (result.landmarks && result.landmarks.length > 0) {
        const lm = result.landmarks[0];
        drawLandmarks(ctx, lm, w, h);
        cand = classifyLetter(lm);
        if (onCandidate) onCandidate(cand);
 
        if (!paused) {
          const stable = stableRef.current.push(cand);
          // StableClassifier now handles re-emission logic internally
          if (stable) {
            onLetter && onLetter(stable);
          }
        }
      } else {
        stableRef.current.push(null);
        if (onCandidate) onCandidate(null);
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [onLetter, onCandidate, paused]);
 
  useEffect(() => {
    let stream = null;
    let cancelled = false;
    (async () => {
      try {
        setStatus("A carregar o modelo…");
        await getHandLandmarker();
        if (cancelled) return;
        setStatus("A pedir acesso à câmara…");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setStatus("Pronto");
        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        console.error(e);
        setError(e.message || "Erro ao aceder à câmara");
      }
    })();
 
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [loop]);
 
  useEffect(() => {
    stableRef.current.reset();
  }, [paused]);
 
  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 border-zinc-800" data-testid="signcam-container">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        playsInline
        muted
        data-testid="signcam-video"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
        data-testid="signcam-canvas"
      />
      {(status !== "Pronto" || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-amber-300 font-mono text-sm p-4 text-center" data-testid="signcam-status">
          {error ? `Erro: ${error}` : status}
        </div>
      )}
    </div>
  );
}