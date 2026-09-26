import { LM, VISIBILITY_THRESHOLD } from "../pose/landmarkIndices";
import { IDEAL_RATIOS } from "./idealRatios";
import type { HeightEstimate, Landmark, Point, PoseFrame, ProportionResult } from "./types";

function toPixel(landmark: Landmark, width: number, height: number): Point {
  return { x: landmark.x * width, y: landmark.y * height };
}

function isVisible(landmark: Landmark | undefined): landmark is Landmark {
  return landmark != null && (landmark.visibility ?? 1) >= VISIBILITY_THRESHOLD;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Distance between two landmarks, in pixels, or null if either is not visible enough to trust. */
function distIfVisible(
  landmarks: Landmark[],
  indexA: number,
  indexB: number,
  width: number,
  height: number,
): number | null {
  const a = landmarks[indexA];
  const b = landmarks[indexB];
  if (!isVisible(a) || !isVisible(b)) return null;
  return dist(toPixel(a, width, height), toPixel(b, width, height));
}

/** Average of the two side measurements that are visible; null if neither side is. */
function averageBilateral(left: number | null, right: number | null): number | null {
  if (left != null && right != null) return (left + right) / 2;
  return left ?? right ?? null;
}

interface RawMeasurements {
  armspan: number | null;
  cubit: number | null;
  footLength: number | null;
  shoulderWidth: number | null;
  armLength: number | null;
}

function computeRawMeasurements(frame: PoseFrame): RawMeasurements {
  const { landmarks, imageWidth: w, imageHeight: h } = frame;

  return {
    armspan: distIfVisible(landmarks, LM.LEFT_WRIST, LM.RIGHT_WRIST, w, h),
    cubit: averageBilateral(
      distIfVisible(landmarks, LM.LEFT_ELBOW, LM.LEFT_INDEX, w, h),
      distIfVisible(landmarks, LM.RIGHT_ELBOW, LM.RIGHT_INDEX, w, h),
    ),
    footLength: averageBilateral(
      distIfVisible(landmarks, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX, w, h),
      distIfVisible(landmarks, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX, w, h),
    ),
    shoulderWidth: distIfVisible(landmarks, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, w, h),
    armLength: averageBilateral(
      distIfVisible(landmarks, LM.LEFT_SHOULDER, LM.LEFT_WRIST, w, h),
      distIfVisible(landmarks, LM.RIGHT_SHOULDER, LM.RIGHT_WRIST, w, h),
    ),
  };
}

/**
 * Computes the user's body proportions (as ratios of their own detected
 * height) and pairs each with its classical ideal for display. Rows whose
 * underlying landmarks were not visible enough are omitted rather than
 * shown with fabricated values.
 */
export function computeProportions(
  frame: PoseFrame,
  height: HeightEstimate,
  userHeightCm?: number,
): ProportionResult[] {
  const raw = computeRawMeasurements(frame);
  const headHeightPx = estimateHeadHeightPx(frame, height);

  const measuredPx: Record<string, number | null> = {
    armspan: raw.armspan,
    cubit: raw.cubit,
    footLength: raw.footLength,
    headHeight: headHeightPx,
    shoulderWidth: raw.shoulderWidth,
    armLength: raw.armLength,
  };

  const results: ProportionResult[] = [];
  for (const ideal of IDEAL_RATIOS) {
    const px = measuredPx[ideal.key];
    if (px == null) continue;
    const actualRatio = px / height.heightPx;
    results.push({
      key: ideal.key,
      label: ideal.label,
      actualRatio,
      idealRatio: ideal.ratio,
      idealLabel: ideal.fraction,
      confident: true,
      actualCm: userHeightCm != null ? actualRatio * userHeightCm : undefined,
      idealCm: userHeightCm != null ? ideal.ratio * userHeightCm : undefined,
    });
  }
  return results;
}

/**
 * MediaPipe has no chin landmark, so head height can't be a direct
 * landmark-to-landmark distance. We use the same ear-width anthropometric
 * proxy as height.ts's heuristic fallback, applied consistently regardless
 * of which method estimated the overall height.
 */
function estimateHeadHeightPx(frame: PoseFrame, height: HeightEstimate): number | null {
  const { landmarks, imageWidth: w, imageHeight: h } = frame;
  const leftEar = landmarks[LM.LEFT_EAR];
  const rightEar = landmarks[LM.RIGHT_EAR];
  if (!isVisible(leftEar) || !isVisible(rightEar)) return null;

  const earL = toPixel(leftEar, w, h);
  const earR = toPixel(rightEar, w, h);
  const headWidthPx = dist(earL, earR);
  const HEAD_HEIGHT_TO_WIDTH_RATIO = 1.3;
  const headHeightPx = headWidthPx * HEAD_HEIGHT_TO_WIDTH_RATIO;

  // Sanity bound: head height can't exceed the detected total height.
  return headHeightPx < height.heightPx ? headHeightPx : null;
}
