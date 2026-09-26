import "./style.css";
import { ImagePoseSource, VideoPoseSource } from "./pose/poseSource";
import { estimateHeight } from "./measurement/height";
import { computeProportions } from "./measurement/proportions";
import { computeVitruvianOverlay } from "./overlay/vitruvianOverlay";
import { drawFrame, drawLandmarkDots, drawOverlay } from "./overlay/canvasRenderer";
import { createCaptureControls } from "./ui/captureControls";
import { createLiveCameraControls } from "./ui/liveCamera";
import { createHeightInput } from "./ui/heightInput";
import { renderResultsTable } from "./ui/resultsTable";
import { renderLimitationsNotice } from "./ui/limitationsNotice";
import type { HeightEstimate, PoseFrame } from "./measurement/types";

type Mode = "photo" | "live";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <main class="page">
    <h1>Hombre de Vitruvio</h1>
    <p class="subtitle">Analizá tus proporciones corporales al estilo del boceto de Da Vinci.</p>
    <div class="mode-switch" role="tablist">
      <button type="button" class="mode-button" data-mode="photo" aria-pressed="true">Foto fija</button>
      <button type="button" class="mode-button" data-mode="live" aria-pressed="false">Cámara en vivo</button>
    </div>
    <p class="mode-hint">Foto de cuerpo completo, de frente, con brazos y piernas extendidos.</p>
    <div id="height-input-slot"></div>
    <div id="photo-slot"></div>
    <div id="live-slot"></div>
    <p id="status" class="status" aria-live="polite"></p>
    <canvas id="canvas" class="canvas"></canvas>
    <label class="debug-toggle">
      <input type="checkbox" id="debug-toggle" />
      Mostrar puntos de detección
    </label>
    <div id="results-slot"></div>
    <div id="limitations-slot"></div>
  </main>
`;

const heightInputSlot = document.querySelector<HTMLDivElement>("#height-input-slot")!;
const photoSlot = document.querySelector<HTMLDivElement>("#photo-slot")!;
const liveSlot = document.querySelector<HTMLDivElement>("#live-slot")!;
const resultsSlot = document.querySelector<HTMLDivElement>("#results-slot")!;
const limitationsSlot = document.querySelector<HTMLDivElement>("#limitations-slot")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const debugToggle = document.querySelector<HTMLInputElement>("#debug-toggle")!;
const modeButtons = document.querySelectorAll<HTMLButtonElement>(".mode-button");
const ctx = canvas.getContext("2d")!;

renderLimitationsNotice(limitationsSlot);

// --- Height input (shared by both modes) --------------------------------

const heightInput = createHeightInput();
heightInputSlot.appendChild(heightInput.root);

// --- Photo mode -------------------------------------------------------

const photoControls = createCaptureControls();
photoSlot.appendChild(photoControls.root);

// Kept so the debug-dots checkbox and the height input can redraw/recompute
// a still photo's results without re-running detection.
let lastPhoto: {
  image: ImageBitmap;
  frame: PoseFrame;
  height: HeightEstimate;
  overlay: ReturnType<typeof computeVitruvianOverlay>;
} | null = null;

function redrawPhoto(): void {
  if (!lastPhoto) return;
  drawFrame(ctx, lastPhoto.image, lastPhoto.image.width, lastPhoto.image.height);
  if (lastPhoto.overlay) drawOverlay(ctx, lastPhoto.overlay);
  if (debugToggle.checked) drawLandmarkDots(ctx, lastPhoto.frame);
}

function renderPhotoResults(): void {
  if (!lastPhoto) return;
  renderResultsTable(
    resultsSlot,
    computeProportions(lastPhoto.frame, lastPhoto.height, heightInput.getValueCm()),
  );
}

photoControls.onImage(async (image) => {
  statusEl.textContent = "Analizando...";
  resultsSlot.innerHTML = "";
  lastPhoto = null;
  drawFrame(ctx, image, image.width, image.height);

  const frame = await new ImagePoseSource(image).detect();
  if (!frame) {
    statusEl.textContent = "No se detectó una persona en la foto. Probá con otra imagen.";
    return;
  }

  const height = estimateHeight(frame);
  if (!height) {
    statusEl.textContent =
      "No se pudo estimar la altura (¿se ven los pies y el cuerpo completo?). Probá con otra foto.";
    return;
  }

  lastPhoto = { image, frame, height, overlay: computeVitruvianOverlay(frame, height) };
  renderPhotoResults();
  redrawPhoto();

  statusEl.textContent =
    height.method === "heuristic"
      ? "Análisis listo (altura estimada de forma aproximada — no se detectó bien la silueta)."
      : "Análisis listo.";
});

heightInput.onChange(renderPhotoResults);

// --- Live camera mode ---------------------------------------------------

const liveControls = createLiveCameraControls();
liveSlot.appendChild(liveControls.root);

let liveLoopRunning = false;

async function liveTick(source: VideoPoseSource, video: HTMLVideoElement): Promise<void> {
  if (!liveLoopRunning) return;

  // Draw the raw camera frame first, unconditionally: a detection error below
  // must never leave the user staring at a blank canvas with no feedback.
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    drawFrame(ctx, video, video.videoWidth, video.videoHeight);
  }

  try {
    const frame = await source.detect();
    if (frame) {
      const height = estimateHeight(frame);
      if (height) {
        renderResultsTable(resultsSlot, computeProportions(frame, height, heightInput.getValueCm()));
        const overlay = computeVitruvianOverlay(frame, height);
        if (overlay) drawOverlay(ctx, overlay);
        if (debugToggle.checked) drawLandmarkDots(ctx, frame);
        statusEl.textContent = "Cámara en vivo — analizando en tiempo real.";
      } else {
        statusEl.textContent = "Cuerpo detectado, pero no se ve completo (¿faltan pies o piernas?).";
      }
    } else {
      statusEl.textContent = "Buscando una persona en cámara...";
    }
  } catch (err) {
    console.error("Error analizando el cuadro de la cámara:", err);
    statusEl.textContent = "La cámara está activa, pero hubo un error analizando este cuadro.";
  }

  if (liveLoopRunning) requestAnimationFrame(() => void liveTick(source, video));
}

liveControls.onStart(() => {
  liveLoopRunning = true;
  const source = new VideoPoseSource(liveControls.videoElement);
  void liveTick(source, liveControls.videoElement);
});

liveControls.onStop(() => {
  liveLoopRunning = false;
  statusEl.textContent = "Cámara detenida.";
});

// --- Mode switching -----------------------------------------------------

function setMode(mode: Mode): void {
  photoSlot.hidden = mode !== "photo";
  liveSlot.hidden = mode !== "live";
  for (const button of modeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  }
  if (mode !== "live") {
    liveControls.stop();
  }
  resultsSlot.innerHTML = "";
  statusEl.textContent = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

for (const button of modeButtons) {
  button.addEventListener("click", () => setMode(button.dataset.mode as Mode));
}

setMode("photo");

debugToggle.addEventListener("change", redrawPhoto);
