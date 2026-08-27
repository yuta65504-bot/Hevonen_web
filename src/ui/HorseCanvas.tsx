import { useEffect, useRef } from "react";
import { Horse } from "../model/Horse";

interface Props {
  horse: Horse;
  scale?: number;
  style?: React.CSSProperties;
}

export function HorseCanvas({ horse, scale = 1, style }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const wCss = 60 * scale;
    const hCss = 40 * scale;
    canvas.width = wCss * dpr;
    canvas.height = hCss * dpr;
    canvas.style.width = `${wCss}px`;
    canvas.style.height = `${hCss}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, wCss, hCss);
    drawHorse(ctx, wCss, hCss, horse.color, horse.accentColor);
  }, [horse.color, horse.accentColor, scale]);

  return <canvas ref={ref} aria-label={horse.name} style={style} />;
}

function drawHorse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bodyColor: string,
  accentColor: string
) {
  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.35);
  ctx.lineTo(w * 0.80, h * 0.30);
  ctx.lineTo(w * 0.85, h * 0.65);
  ctx.lineTo(w * 0.10, h * 0.70);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.beginPath();
  ctx.moveTo(w * 0.70, h * 0.30);
  ctx.lineTo(w * 0.80, h * 0.10);
  ctx.lineTo(w * 0.90, h * 0.15);
  ctx.lineTo(w * 0.82, h * 0.38);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.moveTo(w * 0.80, h * 0.10);
  ctx.lineTo(w * 1.00, h * 0.05);
  ctx.lineTo(w * 0.98, h * 0.28);
  ctx.lineTo(w * 0.88, h * 0.22);
  ctx.closePath();
  ctx.fill();

  // Ear
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(w * 0.88, h * 0.05);
  ctx.lineTo(w * 0.93, h * -0.05);
  ctx.lineTo(w * 0.97, h * 0.07);
  ctx.closePath();
  ctx.fill();

  // Legs
  const legWidth = w * 0.06;
  const legPositions = [0.18, 0.30, 0.58, 0.70];
  ctx.fillStyle = accentColor;
  legPositions.forEach((xFrac) => {
    ctx.fillRect(w * xFrac, h * 0.65, legWidth, h * 0.38);
  });

  // Tail
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.38);
  ctx.lineTo(w * 0.00, h * 0.20);
  ctx.lineTo(w * 0.05, h * 0.18);
  ctx.lineTo(w * 0.16, h * 0.42);
  ctx.closePath();
  ctx.fill();

  // Mane
  ctx.beginPath();
  ctx.moveTo(w * 0.75, h * 0.10);
  ctx.lineTo(w * 0.82, h * -0.02);
  ctx.lineTo(w * 0.88, h * 0.10);
  ctx.lineTo(w * 0.83, h * 0.20);
  ctx.closePath();
  ctx.fill();
}
