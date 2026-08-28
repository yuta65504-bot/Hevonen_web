import { useCallback, useEffect, useRef, useState } from "react";
import { Horse } from "../model/Horse";
import { RaceCourse } from "../model/RaceCourse";
import { Weather } from "../model/Weather";
import { RaceSimulator } from "../model/RaceSimulator";
import { AppLanguage } from "../model/AppLanguage";
import { stringsFor } from "../i18n/strings";
import { CommentaryEvent, generateCommentary } from "../model/Commentary";
import { SoundEffect, SoundEffectPlayer } from "../audio/SoundEffect";

const FRAME_DELAY_MS = 22;
const SLOW_FRAME_DELAY_MS = 55;
const SIMULATION_STEPS_PER_FRAME = 2;
const RESULT_TRANSITION_DELAY_MS = 400;
const PHOTO_FINISH_DELAY_MS = 1200;
const TOTAL_LAPS = 3;
const COMMENTARY_DISPLAY_MS = 1800;

interface Props {
  language: AppLanguage;
  horses: Horse[];
  playerBetHorseId?: number | null;
  weather: Weather;
  raceCourse: RaceCourse;
  soundPlayer: SoundEffectPlayer;
  onRaceComplete: (finishOrder: Horse[], photoFinish: boolean) => void;
}

export function RaceScreen({ language, horses, playerBetHorseId, weather, raceCourse, soundPlayer, onRaceComplete }: Props) {
  const strings = stringsFor(language);
  const trackLength = raceCourse.distanceM;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<number[]>(() => horses.map(() => 0));
  const [finishOrderIdx, setFinishOrderIdx] = useState<number[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const [commentary, setCommentary] = useState<CommentaryEvent | null>(null);
  const [photoFinish, setPhotoFinish] = useState(false);
  const [currentLap, setCurrentLap] = useState(1);

  const onRaceCompleteRef = useRef(onRaceComplete);
  useEffect(() => { onRaceCompleteRef.current = onRaceComplete; }, [onRaceComplete]);

  type CountdownPhase = "venue" | "3" | "2" | "1" | "go" | null;
  const [countdownPhase, setCountdownPhase] = useState<CountdownPhase>("venue");

  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    try {
      prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(id);
    };
    const playTick = (phase: string) => {
      if (phase === "go") soundPlayer.play(SoundEffect.COUNTDOWN_GO);
      else soundPlayer.play(SoundEffect.COUNTDOWN_TICK);
    };
    schedule(() => { if (!cancelled) playTick("3"); setCountdownPhase("3"); }, 1400);
    schedule(() => { if (!cancelled) playTick("2"); setCountdownPhase("2"); }, 1400 + 900);
    schedule(() => { if (!cancelled) playTick("1"); setCountdownPhase("1"); }, 1400 + 900 + 900);
    schedule(() => { if (!cancelled) playTick("go"); setCountdownPhase("go"); }, 1400 + 900 + 900 + 900);
    schedule(() => setCountdownPhase(null), 1400 + 900 + 900 + 900 + 650);
    return () => {
      cancelled = true;
      timers.forEach((id) => clearTimeout(id));
    };
  }, [raceCourse, soundPlayer]);

  const isRacing = countdownPhase === null;

  // commentary refs for throttling
  const prevPositionsRef = useRef<number[]>(horses.map(() => 0));
  const prevFinishOrderRef = useRef<number[]>([]);
  const prevLeaderRef = useRef<number | null>(null);
  const tickRef = useRef(0);
  const lastCommentaryTickRef = useRef(-999);
  const finishTicksRef = useRef<number[]>([]);
  const commentaryTimerRef = useRef<number | null>(null);

  const showCommentary = useCallback((ev: CommentaryEvent) => {
    setCommentary(ev);
    if (commentaryTimerRef.current) window.clearTimeout(commentaryTimerRef.current);
    commentaryTimerRef.current = window.setTimeout(() => setCommentary(null), COMMENTARY_DISPLAY_MS);
  }, []);

  // lap update
  useEffect(() => {
    if (!isRacing) return;
    const maxPos = Math.max(...positions, 0);
    const lap = Math.min(TOTAL_LAPS, Math.floor((maxPos / trackLength) * TOTAL_LAPS) + 1);
    if (lap !== currentLap && lap >= 1 && lap <= TOTAL_LAPS) setCurrentLap(lap);
  }, [positions, trackLength, isRacing, currentLap]);

  // simulation
  useEffect(() => {
    if (!isRacing) return;
    const sim = new RaceSimulator(horses, weather, raceCourse);
    let cancelled = false;
    let raf: number | null = null;
    let lastTime = performance.now();
    prevPositionsRef.current = horses.map(() => 0);
    prevFinishOrderRef.current = [];
    prevLeaderRef.current = null;
    tickRef.current = 0;
    finishTicksRef.current = [];

    const loop = () => {
      if (cancelled) return;
      if (document.visibilityState === "hidden") {
        raf = requestAnimationFrame(loop);
        return;
      }
      const now = performance.now();
      // slow-mo in final 30% if leader ahead and not reduced-motion
      const maxPos = Math.max(...prevPositionsRef.current, 0);
      const inFinalStretch = maxPos > trackLength * 0.72;
      const shouldSlowMo = inFinalStretch && !prefersReducedMotion.current && !raceFinished;
      const frameDelay = shouldSlowMo ? SLOW_FRAME_DELAY_MS : FRAME_DELAY_MS;
      if (now - lastTime < frameDelay) {
        raf = requestAnimationFrame(loop);
        return;
      }
      lastTime = now;

      for (let s = 0; s < SIMULATION_STEPS_PER_FRAME; s++) {
        if (sim.isFinished()) break;
        tickRef.current++;
        const state = sim.step();
        const prevPos = prevPositionsRef.current;
        const prevFO = [...prevFinishOrderRef.current];

        // detect new finishes for photo timing
        if (state.finishOrder.length > prevFO.length) {
          finishTicksRef.current.push(tickRef.current);
        }

        // hoof sound throttling: every 6 ticks
        if (tickRef.current % 6 === 0) {
          soundPlayer.play(SoundEffect.HOOF);
        }

        // commentary
        if (tickRef.current - lastCommentaryTickRef.current > 18) {
          const { event, nextLeaderIdx } = generateCommentary({
            tick: tickRef.current,
            positions: state.positions,
            prevPositions: prevPos,
            horses,
            finishOrderIdx: state.finishOrder,
            prevFinishOrderIdx: prevFO,
            prevLeaderIdx: prevLeaderRef.current,
            language,
            trackLength,
          });
          if (event) {
            lastCommentaryTickRef.current = tickRef.current;
            showCommentary(event);
          }
          prevLeaderRef.current = nextLeaderIdx;
        }

        prevPositionsRef.current = [...state.positions];
        prevFinishOrderRef.current = [...state.finishOrder];
        setPositions([...state.positions]);
        setFinishOrderIdx([...state.finishOrder]);
        if (state.finished) break;
      }

      if (sim.isFinished()) {
        setRaceFinished(true);
        // photo finish detection: last two finishes within 3 ticks = close
        const ticks = finishTicksRef.current;
        let isPhoto = false;
        if (ticks.length >= 2) {
          const lastGap = ticks[ticks.length - 1] - ticks[ticks.length - 2];
          if (lastGap <= 3) isPhoto = true;
          // also check top2 gap small at finish moment
          const anySim = sim as unknown as { positions: number[] };
          const sortedPos = horses.map((_, i) => anySim.positions[i] ?? 0).sort((a, b) => b - a);
          if (sortedPos.length >= 2 && sortedPos[0] - sortedPos[1] < trackLength * 0.012) isPhoto = true;
        }
        if (isPhoto) {
          setPhotoFinish(true);
          soundPlayer.play(SoundEffect.PHOTO_FINISH);
        }
        const delay = isPhoto ? PHOTO_FINISH_DELAY_MS : RESULT_TRANSITION_DELAY_MS;
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
          onRaceCompleteRef.current(ordered, isPhoto);
        }, delay);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (commentaryTimerRef.current) window.clearTimeout(commentaryTimerRef.current);
    };
  }, [isRacing, horses, weather, raceCourse, trackLength, language, showCommentary, soundPlayer, raceFinished]);

  // canvas drawing - draw on positions/lap/commentary changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let resizeTimer: number | null = null;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
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

      ctx.fillStyle = "#D7B98E";
      ctx.beginPath();
      ctx.ellipse(cx, cy, outerRx, outerRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4CAF50";
      ctx.beginPath();
      ctx.ellipse(cx, cy, innerRx, innerRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#388E3C";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, innerRx * 0.55, innerRy * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.2;
      for (let i = 1; i < laneCount; i++) {
        const rx = outerRx - laneWidth * i;
        const ry = outerRy - laneWidth * i * (outerRy / outerRx);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, outerRx, outerRy, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, innerRx, innerRy, 0, 0, Math.PI * 2);
      ctx.stroke();

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

      // lap markers: show 1/TOTAL_LAPS positions along track
      for (let lap = 1; lap < TOTAL_LAPS; lap++) {
        const ratio = lap / TOTAL_LAPS;
        const angle = finishAngle + 2 * Math.PI * ratio;
        const rxMid = (outerRx + innerRx) / 2;
        const ryMid = (outerRy + innerRy) / 2;
        const mx = cx + rxMid * Math.cos(angle);
        const my = cy + ryMid * Math.sin(angle);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.font = "7px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`L${lap + 1}`, mx, my - 6);
      }

      const markerDistances = [400, 800, 1200, 1600, 2000].filter((d) => d < trackLength);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      markerDistances.forEach((d) => {
        const ratio = d / trackLength;
        const angle = finishAngle + 2 * Math.PI * ratio * TOTAL_LAPS;
        // only show markers within first lap visual to avoid clutter
        if (ratio * TOTAL_LAPS > 1) return;
        const rxMid = (outerRx + innerRx) / 2;
        const ryMid = (outerRy + innerRy) / 2;
        const mx = cx + rxMid * Math.cos(angle);
        const my = cy + ryMid * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // weather particles (lightweight)
      if (weather === Weather.RAINY && isRacing) {
        ctx.strokeStyle = "rgba(150,180,255,0.45)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 28; i++) {
          const x = (i * 37) % wCss;
          const y = (i * 57 + tickRef.current * 2) % hCss;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 4, y + 8);
          ctx.stroke();
        }
      } else if (weather === Weather.WINDY && isRacing) {
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 12; i++) {
          const y = 30 + i * 18;
          const offset = (tickRef.current * 3) % wCss;
          const x = (offset + i * 40) % wCss;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 18, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 12, y - 3);
          ctx.lineTo(x + 18, y);
          ctx.lineTo(x + 12, y + 3);
          ctx.stroke();
        }
      }

      // horses - 3 laps mapping
      horses.forEach((horse, index) => {
        const rawRatio = Math.min(1, Math.max(0, (positions[index] ?? 0) / trackLength));
        const isFinishedHorse = finishOrderIdx.includes(index);
        // visual ratio: 3 laps around oval
        const visualRatio = isFinishedHorse ? 1 : (rawRatio * TOTAL_LAPS) % 1;
        // keep finished at finish line (angle  -90 deg)
        const theta = finishAngle + 2 * Math.PI * visualRatio;
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
        // pulse for leader finished
        const finishPos = finishOrderIdx.indexOf(index);
        const isWinner = finishPos === 0 && isFinishedHorse;
        if (isWinner && !prefersReducedMotion.current) {
          ctx.fillStyle = "rgba(255,215,0,0.18)";
          ctx.beginPath();
          const pulseR = laneWidth * (0.9 + Math.sin(Date.now() * 0.008) * 0.15);
          ctx.arc(hx, hy, pulseR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate((tangentDeg * Math.PI) / 180);
        const horseW = laneWidth * 1.45;
        const horseH = laneWidth * 0.95;
        const r = horseH * 0.45;
        ctx.fillStyle = horse.color;
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(-horseW / 2, -horseH / 2, horseW, horseH, r);
          ctx.fill();
        } else {
          ctx.fillRect(-horseW / 2, -horseH / 2, horseW, horseH);
        }
        ctx.beginPath();
        ctx.arc(horseW * 0.32, -horseH * 0.58, horseH * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = horse.accentColor;
        [-0.28, -0.10, 0.10, 0.28].forEach((off) => {
          ctx.fillRect(horseW * off - horseW * 0.03, horseH * 0.10, horseW * 0.06, horseH * 0.45);
        });
        ctx.beginPath();
        ctx.arc(-horseW * 0.42, 0, horseH * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

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
    const onResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(draw, 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeTimer) window.clearTimeout(resizeTimer);
    };
  }, [horses, positions, finishOrderIdx, playerBetHorseId, trackLength, weather, isRacing]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" as unknown as string, minHeight: "100vh" }}>
      <div style={{ padding: "8px 16px 0" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0" }}>
          {countdownPhase !== null ? (countdownPhase === "venue" ? `📍 ${raceCourse.venueEn.toUpperCase()} ${raceCourse.distanceM}m` : countdownPhase === "go" ? "🏁 GO!" : `⏳ ${countdownPhase}...`) : raceFinished ? strings.raceStatus(true) : strings.raceStatus(false)}
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#666" }}>{strings.raceWeather(weather)}</span>
          <span style={{ fontSize: 13, color: "#2E7D32", fontWeight: 600 }}>{strings.courseInfo(raceCourse)}</span>
        </div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 2, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span>{strings.ovalTrackLabel()} • {strings.distanceLabel(raceCourse.distanceM)} • {horses.length}頭</span>
          {isRacing && <span className="badge" style={{ background: "#E8F5E9", color: "#2E7D32", border: "1px solid #C8E6C9" }}>{strings.commentaryLap(currentLap, TOTAL_LAPS)}</span>}
          {photoFinish && <span className="badge" style={{ background: "#FFF3E0", color: "#E65100", border: "1px solid #FFE0B2" }}>{strings.photoFinishLabel()}</span>}
        </div>
        {/* Commentary bar */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className={`commentary-bar ${commentary?.level === "hot" ? "hot" : ""} ${commentary?.level === "finish" ? "finish" : ""}`}
          style={{
            minHeight: 22,
            marginTop: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: commentary ? (commentary.level === "hot" ? "#FFF8E1" : commentary.level === "finish" ? "#E8F5E9" : "#f5f5f5") : "transparent",
            border: commentary ? `1px solid ${commentary.level === "hot" ? "#FFE082" : commentary.level === "finish" ? "#C8E6C9" : "#e0e0e0"}` : "1px solid transparent",
            fontSize: 12,
            fontWeight: commentary?.level === "hot" || commentary?.level === "finish" ? 700 : 500,
            color: commentary ? "#212121" : "transparent",
            opacity: commentary ? 1 : 0,
            transform: commentary ? "scale(1)" : "scale(0.98)",
            transition: "opacity 0.18s, transform 0.18s, background 0.18s",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {commentary?.text ?? "—"}
        </div>
      </div>

      <div ref={containerRef} style={{ flex: 1, margin: 8, background: "#2E7D32", borderRadius: 12, overflow: "hidden", position: "relative", minHeight: 240 }}>
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
                <div style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: "0.06em", textShadow: "0 4px 18px rgba(0,0,0,0.65)", textTransform: "uppercase", lineHeight: 1, textAlign: "center", padding: "0 12px" }}>{raceCourse.venueEn}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "white", marginTop: 6, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{raceCourse.distanceM}m</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 10, letterSpacing: "0.08em", textAlign: "center", padding: "0 16px" }}>{raceCourse.nameEn}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 14, letterSpacing: "0.12em" }}>GET READY — {TOTAL_LAPS} LAPS</div>
              </>
            ) : countdownPhase === "go" ? (
              <div style={{ fontSize: 86, fontWeight: 900, color: "#FFD700", textShadow: "0 6px 22px rgba(0,0,0,0.75), 0 0 30px rgba(255,215,0,0.35)", animation: "hevonen-pop 0.55s ease" }}>GO!</div>
            ) : (
              <div style={{ fontSize: 108, fontWeight: 900, color: "white", textShadow: "0 6px 22px rgba(0,0,0,0.75)", lineHeight: 1 }}>{countdownPhase}</div>
            )}
          </div>
        )}
        {photoFinish && raceFinished && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9, pointerEvents: "none" }}>
            <div style={{ background: "rgba(255,255,255,0.92)", color: "#E65100", fontWeight: 900, fontSize: 18, padding: "8px 16px", borderRadius: 999, boxShadow: "0 4px 18px rgba(0,0,0,0.25)", border: "2px solid #FFB74D", animation: "hevonen-pop 0.45s ease" }}>{strings.photoFinishLabel()}</div>
          </div>
        )}
      </div>

      <div style={{ maxHeight: 220, overflowY: "auto", padding: "8px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {horses.map((horse, idx) => {
          const finishPos = finishOrderIdx.indexOf(idx);
          const progress = Math.min(100, Math.max(0, Math.round(((positions[idx] ?? 0) / trackLength) * 100)));
          const isLeader = !raceFinished && positions.indexOf(Math.max(...positions)) === idx && finishPos === -1;
          const lapForHorse = Math.min(TOTAL_LAPS, Math.floor(((positions[idx] ?? 0) / trackLength) * TOTAL_LAPS) + 1);
          return (
            <div key={horse.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                {horse.id === playerBetHorseId && <span>⭐</span>}
                {isLeader && <span>⚡</span>}
                <span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{horse.name}</span>
                <span style={{ fontSize: 10, color: "#666" }}>{progress}% • L{lapForHorse}</span>
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
