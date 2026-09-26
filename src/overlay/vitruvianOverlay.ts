import { LM, VISIBILITY_THRESHOLD } from "../pose/landmarkIndices";
import type { HeightEstimate, Landmark, Point, PoseFrame } from "../measurement/types";

export interface VitruvianOverlayGeometry {
  square: { x: number; y: number; size: number };
  circle: { center: Point; radius: number };
}

function toPixel(landmark: Landmark, width: number, height: number): Point {
  return { x: landmark.x * width, y: landmark.y * height };
}

function isVisible(landmark: Landmark | undefined): landmark is Landmark {
  return landmark != null && (landmark.visibility ?? 1) >= VISIBILITY_THRESHOLD;
}

/**
 * Derives the circle-and-square overlay from one photo's landmarks. This is
 * a deliberate simplification of Da Vinci's sketch, which overlays two
 * different poses (arms-out for the square, arms-and-legs-spread for the
 * circle) that can't both be reconstructed from a single still — the UI
 * must present this as illustrative, not an exact reproduction.
 *
 * Square: side = detected height, centered on the body's vertical centerline.
 * Circle: centered on the hip midpoint (navel proxy), radius = navel-to-ground.
 */
export function computeVitruvianOverlay(
  frame: PoseFrame,
  height: HeightEstimate,
): VitruvianOverlayGeometry | null {
  const { landmarks, imageWidth: w, imageHeight: h } = frame;

  const leftHip = landmarks[LM.LEFT_HIP];
  const rightHip = landmarks[LM.RIGHT_HIP];
  const leftShoulder = landmarks[LM.LEFT_SHOULDER];
  const rightShoulder = landmarks[LM.RIGHT_SHOULDER];

  if (
    !isVisible(leftHip) ||
    !isVisible(rightHip) ||
    !isVisible(leftShoulder) ||
    !isVisible(rightShoulder)
  ) {
    return null;
  }

  const hipL = toPixel(leftHip, w, h);
  const hipR = toPixel(rightHip, w, h);
  const shoulderL = toPixel(leftShoulder, w, h);
  const shoulderR = toPixel(rightShoulder, w, h);

  const navel: Point = { x: (hipL.x + hipR.x) / 2, y: (hipL.y + hipR.y) / 2 };
  const shoulderMid: Point = { x: (shoulderL.x + shoulderR.x) / 2, y: (shoulderL.y + shoulderR.y) / 2 };
  const centerlineX = (navel.x + shoulderMid.x) / 2;

  const square = {
    x: centerlineX - height.heightPx / 2,
    y: height.topOfHeadPx.y,
    size: height.heightPx,
  };

  const circle = {
    center: navel,
    radius: height.groundPx.y - navel.y,
  };

  return { square, circle };
}
