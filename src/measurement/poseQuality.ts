import { LM, VISIBILITY_THRESHOLD } from "../pose/landmarkIndices";
import type { Landmark, Point, PoseFrame } from "./types";

function toPixel(landmark: Landmark, width: number, height: number): Point {
  return { x: landmark.x * width, y: landmark.y * height };
}

function isVisible(landmark: Landmark | undefined): landmark is Landmark {
  return landmark != null && (landmark.visibility ?? 1) >= VISIBILITY_THRESHOLD;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** How level the wrist is with the shoulder, relative to shoulder width (scale-invariant). */
const ARM_LEVEL_TOLERANCE = 0.4;
/** How far apart the wrists must be, relative to shoulder width, to count as "extended". */
const ARM_SPAN_MIN_RATIO = 1.4;
/** How far apart the ankles must be, relative to shoulder width, to count as "spread". */
const LEG_SPREAD_MIN_RATIO = 0.9;

/**
 * Heuristic check for "the person looks like they're holding the Vitruvian
 * pose right now" — arms roughly level with the shoulders and spread wide,
 * legs apart. It's intentionally loose (a convenience trigger for
 * auto-capture, not a measurement), so it favors avoiding false negatives
 * over being strict about form.
 */
export function isVitruvianPoseReady(frame: PoseFrame): boolean {
  const { landmarks, imageWidth: w, imageHeight: h } = frame;

  const leftShoulder = landmarks[LM.LEFT_SHOULDER];
  const rightShoulder = landmarks[LM.RIGHT_SHOULDER];
  const leftWrist = landmarks[LM.LEFT_WRIST];
  const rightWrist = landmarks[LM.RIGHT_WRIST];
  const leftAnkle = landmarks[LM.LEFT_ANKLE];
  const rightAnkle = landmarks[LM.RIGHT_ANKLE];

  if (
    ![leftShoulder, rightShoulder, leftWrist, rightWrist, leftAnkle, rightAnkle].every(isVisible)
  ) {
    return false;
  }

  const shoulderL = toPixel(leftShoulder, w, h);
  const shoulderR = toPixel(rightShoulder, w, h);
  const wristL = toPixel(leftWrist, w, h);
  const wristR = toPixel(rightWrist, w, h);
  const ankleL = toPixel(leftAnkle, w, h);
  const ankleR = toPixel(rightAnkle, w, h);

  const shoulderWidth = dist(shoulderL, shoulderR);
  if (shoulderWidth <= 0) return false;

  const armsLevel =
    Math.abs(wristL.y - shoulderL.y) <= ARM_LEVEL_TOLERANCE * shoulderWidth &&
    Math.abs(wristR.y - shoulderR.y) <= ARM_LEVEL_TOLERANCE * shoulderWidth;

  const armsExtended = dist(wristL, wristR) >= ARM_SPAN_MIN_RATIO * shoulderWidth;

  const legsSpread = dist(ankleL, ankleR) >= LEG_SPREAD_MIN_RATIO * shoulderWidth;

  return armsLevel && armsExtended && legsSpread;
}
