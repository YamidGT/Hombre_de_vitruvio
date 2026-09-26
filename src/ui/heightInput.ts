export interface HeightInput {
  root: HTMLElement;
  /** Current value in cm, or undefined if empty/invalid. Shared by photo and live modes. */
  getValueCm: () => number | undefined;
  onChange: (callback: () => void) => void;
}

const MIN_CM = 50;
const MAX_CM = 250;

export function createHeightInput(): HeightInput {
  const root = document.createElement("label");
  root.className = "height-input";
  root.textContent = "Tu altura real (cm, opcional): ";

  const input = document.createElement("input");
  input.type = "number";
  input.min = String(MIN_CM);
  input.max = String(MAX_CM);
  input.step = "0.1";
  input.placeholder = "ej: 170";

  root.appendChild(input);

  const listeners: Array<() => void> = [];
  input.addEventListener("input", () => {
    for (const cb of listeners) cb();
  });

  function getValueCm(): number | undefined {
    const value = input.valueAsNumber;
    if (Number.isNaN(value) || value < MIN_CM || value > MAX_CM) return undefined;
    return value;
  }

  return { root, getValueCm, onChange: (cb) => listeners.push(cb) };
}
