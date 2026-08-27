import { useEffect, useRef, useState } from "react";
import { Horse } from "../model/Horse";
import { RaceCourse } from "../model/RaceCourse";
import { Weather } from "../model/Weather";
import { RaceSimulator } from "../model/RaceSimulator";
import { AppLanguage } from "../model/AppLanguage";
import { stringsFor } from "../i18n/strings";

const FRAME_DELAY_MS = 22; // slowed from 14
const SIMULATION_STEPS_PER_FRAME = 2; // slowed from 4
const RESULT_TRANSITION_DELAY_MS = 400;

interface Props {
  language: AppLanguage;
  horses: Horse[];
  playerBetHorseId?: number | null;
  weather: Weather;
  raceCourse: RaceCourse;
  onRaceComplete: (finishOrder: Horse[]) => void;
}

export function RaceScreen({ language, horses, playerBetHorseId, weather, raceCourse, onRaceComplete }: Props) {
  const strings = stringsFor(language);
  const trackLength = raceCourse.distanceM;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<number[]>(() => horses.map(() => 0));
  const [finishOrderIdx, setFinishOrderIdx] = useState<number[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);

  const onRaceCompleteRef = useRef(onRaceComplete);
  useEffect(() => { onRaceCompleteRef.current = onRaceComplete; }, [onRaceComplete]);

  // 3秒カウントダウン + 開催場所（英語）大きく表示
  type CountdownPhase = "venue" | "3" | "2" | "1" | "go" | null;
  const [countdownPhase, setCountdownPhase] = useState<CountdownPhase>("venue");

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(id);
    };
    // venue (english) -> 3 -> 2 -> 1 -> GO -> race start
    schedule(() => setCountdownPhase("3"), 1400);       // venue 1.4s
    schedule(() => setCountdownPhase("2"), 1400 + 900); // 3 for 0.9s
    schedule(() => setCountdownPhase("1"), 1400 + 900 + 900);
    schedule(() => setCountdownPhase("go"), 1400 + 900 + 900 + 900);
    schedule(() => setCountdownPhase(null), 1400 + 900 + 900 + 900 + 650); // go 0.65s
    return () => {
      cancelled = true;
      timers.forEach((id) => clearTimeout(id));
    };
  }, [raceCourse]);

  const isRacing = countdownPhase === null;

  // simulation (start after countdown)
  useEffect(() => {
    if (!isRacing) return;
    const sim = new RaceSimulator(horses, weather, raceCourse);
    let cancelled = false;
    let raf: number | null = null;
    let lastTime = performance.now();

    const loop = () => {
      if (cancelled) return;
      const now = performance.now();
      if (now - lastTime < FRAME_DELAY_MS) {
        raf = requestAnimationFrame(loop);
        return;
      }
      lastTime = now;
      for (let s = 0; s < SIMULATION_STEPS_PER_FRAME; s++) {
        if (!sim.isFinished()) {
          const state = sim.step();
          setPositions([...state.positions]);
          setFinishOrderIdx([...state.finishOrder]);
          if (state.finished) break;
        }
      }
      if (sim.isFinished()) {
        setRaceFinished(true);
        setTimeout(() => {
          if (cancelled) return;
          const anySim = sim as unknown as { finishOrder: number[]; positions: number[] };
          let finalOrder = anySim.finishOrder;
          if (!finalOrder || finalOrder.length !== horses.length) {
            finalOrder = horses.map((_, i) => i).sort((a, b) => {
              const pa = anySim.positions[a] ?? 0;
              const pb = anySim.positions[b] ?? 0;
              return pb - pa;
            });
          }
          const ordered = finalOrder.map((i) => horses[i]);
          onRaceCompleteRef.current(ordered);
        }, RESULT_TRANSITION_DELAY_MS);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isRacing, horses, weather, raceCourse]);

  // Keep orderedHorses var for timeout closure alternative (derived during render)
  // canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      // Use container size for canvas
      const wCss = rect.width;
      const hCss = rect.height;
      canvas.width = wCss * dpr;
      canvas.height = hCss * dpr;
      canvas.style.width = `${wCss}px`;
      canvas.style.height = `${hCss}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, wCss, hCss);

      const pad = 14;
      const outerLeft = pad;
      const outerTop = pad;
      const outerRight = wCss - pad;
      const outerBottom = hCss - pad;
      const cx = (outerLeft + outerRight) / 2;
      const cy = (outerTop + outerBottom) / 2;
      const outerRx = (outerRight - outerLeft) / 2;
      const outerRy = (outerBottom - outerTop) / 2 * 0.78;
      const laneCount = horses.length;
      const trackThickness = Math.min(outerRx * 0.5, Math.max(22 * laneCount * 0.12, outerRx * 0.42));
      const laneWidth = trackThickness / laneCount;
      const innerRx = Math.max(outerRx * 0.28, outerRx - trackThickness);
      const innerRy = Math.max(outerRy * 0.28, outerRy - trackThickness * (outerRy / outerRx));

      // track base outer
      ctx.fillStyle = "#D7B98E";
      ctx.beginPath();
      ctx.ellipse(cx, cy, outerRx, outerRy, 0, 0, Math.PI * 2);
      ctx.fill();
      // inner infield
      ctx.fillStyle = "#4CAF50";
      ctx.beginPath();
      ctx.ellipse(cx, cy, innerRx, innerRy, 0, 0, Math.PI * 2);
      ctx.fill();
      // inner decoration stroke
      ctx.strokeStyle = "#388E3C";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, innerRx * 0.55, innerRy * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      // lane lines
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.2;
      for (let i = 1; i < laneCount; i++) {
        const rx = outerRx - laneWidth * i;
        const ry = outerRy - laneWidth * i * (outerRy / outerRx);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // borders
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, outerRx, outerRy, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, innerRx, innerRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // finish line at top
      const finishAngle = -Math.PI / 2;
      const outerFx = cx + outerRx * Math.cos(finishAngle);
      const outerFy = cy + outerRy * Math.sin(finishAngle);
      const innerFx = cx + innerRx * Math.cos(finishAngle);
      const innerFy = cy + innerRy * Math.sin(finishAngle);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(outerFx, outerFy);
      ctx.lineTo(innerFx, innerFy);
      ctx.stroke();
      // checkered
      const segments = 6;
      ctx.lineWidth = 6;
      for (let s = 0; s < segments; s++) {
        if (s % 2 === 0) {
          const t = s / segments;
          const nt = (s + 1) / segments;
          const sx = outerFx + (innerFx - outerFx) * t;
          const sy = outerFy + (innerFy - outerFy) * t;
          const ex = outerFx + (innerFx - outerFx) * nt;
          const ey = outerFy + (innerFy - outerFy) * nt;
          ctx.strokeStyle = "black";
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }

      // distance markers
      const markerDistances = [400, 800, 1200, 1600, 2000].filter((d) => d < trackLength);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      markerDistances.forEach((d) => {
        const ratio = d / trackLength;
        const angle = finishAngle + 2 * Math.PI * ratio;
        const rxMid = (outerRx + innerRx) / 2;
        const ryMid = (outerRy + innerRy) / 2;
        const mx = cx + rxMid * Math.cos(angle);
        const my = cy + ryMid * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // horses
      horses.forEach((horse, index) => {
        const posRatio = Math.min(1, Math.max(0, (positions[index] ?? 0) / trackLength));
        const theta = finishAngle + 2 * Math.PI * posRatio;
        const rxLane = outerRx - laneWidth * (index + 0.5);
        const ryLane = outerRy - laneWidth * (index + 0.5) * (outerRy / outerRx);
        const hx = cx + rxLane * Math.cos(theta);
        const hy = cy + ryLane * Math.sin(theta);
        const tangentDeg = (theta * 180) / Math.PI + 90;

        if (horse.id === playerBetHorseId) {
          ctx.fillStyle = "rgba(255,215,0,0.27)";
          ctx.beginPath();
          ctx.arc(hx, hy, laneWidth * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate((tangentDeg * Math.PI) / 180);
        const horseW = laneWidth * 1.45;
        const horseH = laneWidth * 0.95;
        // body round rect approximation
        const r = horseH * 0.45;
        ctx.fillStyle = horse.color;
        // roundRect fallback
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(-horseW / 2, -horseH / 2, horseW, horseH, r);
          ctx.fill();
        } else {
          ctx.fillRect(-horseW / 2, -horseH / 2, horseW, horseH);
        }
        // head circle
        ctx.beginPath();
        ctx.arc(horseW * 0.32, -horseH * 0.58, horseH * 0.28, 0, Math.PI * 2);
        ctx.fill();
        // legs
        ctx.fillStyle = horse.accentColor;
        [-0.28, -0.10, 0.10, 0.28].forEach((off) => {
          ctx.fillRect(horseW * off - horseW * 0.03, horseH * 0.10, horseW * 0.06, horseH * 0.45);
        });
        // tail
        ctx.beginPath();
        ctx.arc(-horseW * 0.42, 0, horseH * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const finishPos = finishOrderIdx.indexOf(index);
        if (finishPos >= 0) {
          let color = "white";
          if (finishPos === 0) color = "#FFD700";
          else if (finishPos === 1) color = "#C0C0C0";
          else if (finishPos === 2) color = "#CD7F32";
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(hx, hy - laneWidth * 1.1, laneWidth * 0.38, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = finishPos <= 2 ? "white" : "#333";
          ctx.font = `${Math.round(laneWidth * 0.5)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          if (finishPos <= 2) ctx.fillText(String(finishPos + 1), hx, hy - laneWidth * 1.1);
        }
      });
    };

    draw();
    // redraw on position change via rAF
    let raf = requestAnimationFrame(function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    });
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [horses, positions, finishOrderIdx, playerBetHorseId, trackLength]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" as unknown as string, minHeight: "100vh" }}>
      <div style={{ padding: "8px 16px 0" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0" }}>
          {countdownPhase !== null ? (countdownPhase === "venue" ? `📍 ${raceCourse.venueEn.toUpperCase()} ${raceCourse.distanceM}m` : countdownPhase === "go" ? "🏁 GO!" : `⏳ ${countdownPhase}...`) : strings.raceStatus(raceFinished)}
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#666" }}>{strings.raceWeather(weather)}</span>
          <span style={{ fontSize: 13, color: "#2E7D32", fontWeight: 600 }}>{strings.courseInfo(raceCourse)}</span>
        </div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{strings.ovalTrackLabel()} • {strings.distanceLabel(raceCourse.distanceM)} • {horses.length}頭</div>
      </div>

      <div ref={containerRef} style={{ flex: 1, margin: 8, background: "#2E7D32", borderRadius: 12, overflow: "hidden", position: "relative", minHeight: 220 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        {countdownPhase !== null && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.62)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              backdropFilter: "blur(1px)",
            }}
          >
            {countdownPhase === "venue" ? (
              <>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", letterSpacing: "0.18em", fontWeight: 600, marginBottom: 10 }}>VENUE</div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    color: "white",
                    letterSpacing: "0.06em",
                    textShadow: "0 4px 18px rgba(0,0,0,0.65)",
                    textTransform: "uppercase",
                    lineHeight: 1,
                    textAlign: "center",
                    padding: "0 12px",
                  }}
                >
                  {raceCourse.venueEn}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "white", marginTop: 6, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{raceCourse.distanceM}m</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 10, letterSpacing: "0.08em", textAlign: "center", padding: "0 16px" }}>{raceCourse.nameEn}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 14, letterSpacing: "0.12em" }}>GET READY</div>
              </>
            ) : countdownPhase === "go" ? (
              <div
                style={{
                  fontSize: 86,
                  fontWeight: 900,
                  color: "#FFD700",
                  textShadow: "0 6px 22px rgba(0,0,0,0.75), 0 0 30px rgba(255,215,0,0.35)",
                  transform: "scale(1)",
                  animation: "hevonen-pop 0.55s ease",
                }}
              >
                GO!
              </div>
            ) : (
              <div
                style={{
                  fontSize: 108,
                  fontWeight: 900,
                  color: "white",
                  textShadow: "0 6px 22px rgba(0,0,0,0.75)",
                  lineHeight: 1,
                }}
              >
                {countdownPhase}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ maxHeight: 220, overflowY: "auto", padding: "8px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {horses.map((horse, idx) => {
          const finishPos = finishOrderIdx.indexOf(idx);
          const progress = Math.min(100, Math.max(0, Math.round(((positions[idx] ?? 0) / trackLength) * 100)));
          const isLeader = !raceFinished && positions.indexOf(Math.max(...positions)) === idx && finishPos === -1;
          return (
            <div key={horse.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                {horse.id === playerBetHorseId && <span>⭐</span>}
                {isLeader && <span>⚡</span>}
                <span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{horse.name}</span>
                <span style={{ fontSize: 10, color: "#666" }}>{progress}%</span>
              </div>
              <span style={{ color: finishPos === 0 ? "#FFD700" : "#333", fontWeight: finishPos === 0 ? 700 : 400 }}>
                {finishPos >= 0 ? `#${finishPos + 1}` : strings.racingLabel()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
