export interface CaptureControls {
  root: HTMLElement;
  onImage: (callback: (image: ImageBitmap) => void) => void;
}

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export function createCaptureControls(): CaptureControls {
  const root = document.createElement("div");
  root.className = "capture-controls";

  const dropzone = document.createElement("label");
  dropzone.className = "dropzone";
  dropzone.textContent = "Subí una foto de cuerpo completo (o arrastrala aquí)";

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";
  input.className = "visually-hidden";

  dropzone.appendChild(input);
  root.appendChild(dropzone);

  const listeners: Array<(image: ImageBitmap) => void> = [];

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    const bitmap = await fileToBitmap(file);
    for (const cb of listeners) cb(bitmap);
  }

  input.addEventListener("change", () => {
    handleFile(input.files?.[0]);
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dropzone--active");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dropzone--active");
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dropzone--active");
    handleFile(e.dataTransfer?.files?.[0]);
  });

  return {
    root,
    onImage: (callback) => listeners.push(callback),
  };
}
