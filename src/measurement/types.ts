export interface Point {
  x: number;
  y: number;
}

/** A single MediaPipe pose landmark, in normalized [0,1] image coordinates. */
export interface Landmark extends Point {
  z: number;
  visibility?: number;
}

export interface PoseFrame {
  landmarks: Landmark[];
  /** Image size in pixels, needed to convert normalized landmarks to pixel space. */
  imageWidth: number;
  imageHeight: number;
  /** Segmentation mask, row-major, one confidence value [0,1] per pixel at imageWidth x imageHeight. */
  segmentationMask?: Float32Array;
}

export interface ProportionResult {
  key: string;
  label: string;
  actualRatio: number;
  idealRatio: number;
  idealLabel: string;
  /** false when a landmark this measurement depends on had low visibility/presence. */
  confident: boolean;
  /** Present only when the user entered their real height, so ratios can be converted to cm. */
  actualCm?: number;
  idealCm?: number;
}

export interface HeightEstimate {
  topOfHeadPx: Point;
  groundPx: Point;
  heightPx: number;
  /** How the top-of-head point was derived. */
  method: "segmentation" | "heuristic";
}
