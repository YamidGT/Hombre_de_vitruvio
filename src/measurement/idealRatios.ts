export interface IdealRatio {
  key: string;
  label: string;
  ratio: number;
  /** Human-readable form, e.g. "1/6" — shown alongside the decimal value. */
  fraction: string;
  source: "vitruvius" | "anthropometric-approximation";
}

/**
 * Classical proportions, expressed as measurement / total height.
 * The Vitruvius-sourced ones come from De Architectura, Book III, Ch. 1.
 * Shoulder width is a common modern approximation, not literally in
 * Vitruvius' text, and is labeled as such in the UI.
 */
export const IDEAL_RATIOS: IdealRatio[] = [
  { key: "armspan", label: "Envergadura de brazos", ratio: 1, fraction: "1/1", source: "vitruvius" },
  { key: "cubit", label: "Cúbito (codo a dedos)", ratio: 1 / 4, fraction: "1/4", source: "vitruvius" },
  { key: "footLength", label: "Largo de pie", ratio: 1 / 6, fraction: "1/6", source: "vitruvius" },
  { key: "headHeight", label: "Altura de cabeza", ratio: 1 / 8, fraction: "1/8", source: "vitruvius" },
  {
    key: "shoulderWidth",
    label: "Ancho de hombros",
    ratio: 1 / 4,
    fraction: "1/4",
    source: "anthropometric-approximation",
  },
  { key: "armLength", label: "Largo de brazo (hombro a muñeca)", ratio: 2 / 5, fraction: "2/5", source: "vitruvius" },
];
