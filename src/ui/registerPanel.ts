import type { ProportionResult } from "../measurement/types";
import { renderResultsTable } from "./resultsTable";

export interface RegisterSnapshot {
  proportions: ProportionResult[];
  imageDataUrl: string;
  timestamp: Date;
}

export interface RegisterPanel {
  /** Button + auto-capture checkbox, meant to sit near the camera controls. */
  controlsRoot: HTMLElement;
  /** The frozen snapshot display (thumbnail + table + discard), hidden until first capture. */
  snapshotRoot: HTMLElement;
  onCapture: (callback: () => void) => void;
  isAutoCaptureEnabled: () => boolean;
  setCaptureEnabled: (enabled: boolean) => void;
  showSnapshot: (snapshot: RegisterSnapshot) => void;
  clearSnapshot: () => void;
}

export function createRegisterPanel(): RegisterPanel {
  const controlsRoot = document.createElement("div");
  controlsRoot.className = "register-controls";

  const captureButton = document.createElement("button");
  captureButton.type = "button";
  captureButton.className = "camera-button";
  captureButton.textContent = "Registrar medidas";
  captureButton.disabled = true;

  const autoLabel = document.createElement("label");
  autoLabel.className = "auto-capture-toggle";
  const autoCheckbox = document.createElement("input");
  autoCheckbox.type = "checkbox";
  autoLabel.append(autoCheckbox, " Registrar automáticamente al detectar la postura");

  controlsRoot.append(captureButton, autoLabel);

  const snapshotRoot = document.createElement("div");
  snapshotRoot.className = "register-snapshot";
  snapshotRoot.hidden = true;

  const heading = document.createElement("div");
  heading.className = "register-snapshot-heading";
  const timestampEl = document.createElement("span");
  timestampEl.className = "register-timestamp";
  const discardButton = document.createElement("button");
  discardButton.type = "button";
  discardButton.className = "camera-button";
  discardButton.textContent = "Descartar";
  heading.append(timestampEl, discardButton);

  const thumbnail = document.createElement("img");
  thumbnail.className = "register-thumbnail";
  thumbnail.alt = "Foto del momento en que se registraron las medidas";

  const tableSlot = document.createElement("div");

  snapshotRoot.append(heading, thumbnail, tableSlot);

  const captureListeners: Array<() => void> = [];
  captureButton.addEventListener("click", () => {
    for (const cb of captureListeners) cb();
  });

  discardButton.addEventListener("click", () => {
    snapshotRoot.hidden = true;
  });

  return {
    controlsRoot,
    snapshotRoot,
    onCapture: (cb) => captureListeners.push(cb),
    isAutoCaptureEnabled: () => autoCheckbox.checked,
    setCaptureEnabled: (enabled) => {
      captureButton.disabled = !enabled;
    },
    showSnapshot: ({ proportions, imageDataUrl, timestamp }) => {
      timestampEl.textContent = `Registrado a las ${timestamp.toLocaleTimeString()}`;
      thumbnail.src = imageDataUrl;
      renderResultsTable(tableSlot, proportions);
      snapshotRoot.hidden = false;
    },
    clearSnapshot: () => {
      snapshotRoot.hidden = true;
    },
  };
}
