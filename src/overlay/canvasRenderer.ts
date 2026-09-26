import type { PoseFrame } from "../measurement/types";
import type { VitruvianOverlayGeometry } from "./vitruvianOverlay";

/** Draws a still photo or a live video frame onto the canvas, resizing it to match. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
): void {
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.drawImage(source, 0, 0, width, height);
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  geometry: VitruvianOverlayGeometry,
): void {
  ctx.save();
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = Math.max(2, ctx.canvas.width / 400);

  ctx.strokeRect(geometry.square.x, geometry.square.y, geometry.square.size, geometry.square.size);

  ctx.beginPath();
  ctx.arc(geometry.circle.center.x, geometry.circle.center.y, geometry.circle.radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/** Debug view: draws a dot at every landmark, useful to see why the overlay landed where it did. */
export function drawLandmarkDots(ctx: CanvasRenderingContext2D, frame: PoseFrame): void {
  ctx.save();
  ctx.fillStyle = "#3aa0ff";
  const radius = Math.max(2, ctx.canvas.width / 250);

  for (let i = 0; i < frame.landmarks.length; i++) {
    const lm = frame.landmarks[i];
    if ((lm.visibility ?? 1) < 0.5) continue;
    const x = lm.x * frame.imageWidth;
    const y = lm.y * frame.imageHeight;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
