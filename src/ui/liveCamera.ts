export interface LiveCameraControls {
  root: HTMLElement;
  videoElement: HTMLVideoElement;
  onStart: (callback: () => void) => void;
  onStop: (callback: () => void) => void;
  /** Stops the camera stream if active; safe to call even when already stopped. */
  stop: () => void;
}

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

  root.append(startButton, stopButton, errorEl, video);

  let stream: MediaStream | null = null;
  const startListeners: Array<() => void> = [];
  const stopListeners: Array<() => void> = [];

  function stop(): void {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    startButton.disabled = false;
    stopButton.disabled = true;
    for (const cb of stopListeners) cb();
  }

  startButton.addEventListener("click", async () => {
    errorEl.textContent = "";
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      startButton.disabled = true;
      stopButton.disabled = false;
      for (const cb of startListeners) cb();
    } catch (err) {
      errorEl.textContent =
        "No se pudo acceder a la cámara. Revisá los permisos del navegador e intentá de nuevo.";
      console.error(err);
    }
  });

  stopButton.addEventListener("click", stop);

  return {
    root,
    videoElement: video,
    onStart: (cb) => startListeners.push(cb),
    onStop: (cb) => stopListeners.push(cb),
    stop,
  };
}
