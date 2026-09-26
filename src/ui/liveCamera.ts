export interface LiveCameraControls {
  root: HTMLElement;
  videoElement: HTMLVideoElement;
  onStart: (callback: () => void) => void;
  onStop: (callback: () => void) => void;
  /** Stops the camera stream if active; safe to call even when already stopped. */
  stop: () => void;
}

type FacingMode = "environment" | "user";

export function createLiveCameraControls(): LiveCameraControls {
  const root = document.createElement("div");
  root.className = "live-camera";

  // Not displayed directly — main.ts draws its frames onto the results canvas
  // alongside the overlay, same as it does for an uploaded photo.
  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.className = "visually-hidden";

  const facingSelect = document.createElement("select");
  facingSelect.className = "camera-select";
  facingSelect.innerHTML = `
    <option value="environment">Cámara trasera</option>
    <option value="user">Cámara frontal</option>
  `;

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "camera-button";
  startButton.textContent = "Iniciar cámara";

  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.className = "camera-button";
  stopButton.textContent = "Detener cámara";
  stopButton.disabled = true;

  const errorEl = document.createElement("p");
  errorEl.className = "camera-error";

  root.append(facingSelect, startButton, stopButton, errorEl, video);

  let stream: MediaStream | null = null;
  const startListeners: Array<() => void> = [];
  const stopListeners: Array<() => void> = [];

  function stopStream(): void {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  function stop(): void {
    stopStream();
    video.srcObject = null;
    startButton.disabled = false;
    stopButton.disabled = true;
    for (const cb of stopListeners) cb();
  }

  /** `ideal` (not `exact`) so desktops without a front/back camera distinction still work. */
  async function openStream(facingMode: FacingMode): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  }

  startButton.addEventListener("click", async () => {
    errorEl.textContent = "";
    try {
      stream = await openStream(facingSelect.value as FacingMode);
      video.srcObject = stream;
      await video.play();
      startButton.disabled = true;
      stopButton.disabled = false;
      facingSelect.disabled = true;
      for (const cb of startListeners) cb();
    } catch (err) {
      errorEl.textContent =
        "No se pudo acceder a la cámara. Revisá los permisos del navegador e intentá de nuevo.";
      console.error(err);
    }
  });

  stopButton.addEventListener("click", () => {
    stop();
    facingSelect.disabled = false;
  });

  return {
    root,
    videoElement: video,
    onStart: (cb) => startListeners.push(cb),
    onStop: (cb) => stopListeners.push(cb),
    stop,
  };
}
