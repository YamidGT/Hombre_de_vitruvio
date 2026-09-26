import { LM, VISIBILITY_THRESHOLD } from "../pose/landmarkIndices";
import type { HeightEstimate, Landmark, PoseFrame, Point } from "./types";

const SEGMENTATION_CONFIDENCE_THRESHOLD = 0.5;
/** Half-width, in pixels, of the column searched around the nose x for the top-of-head row. */
const HEAD_SEARCH_BAND_PX = 40;
/** Average human head-height : head-width ratio, used only by the fallback heuristic. */
const HEAD_HEIGHT_TO_WIDTH_RATIO = 1.3;

function toPixel(landmark: Landmark, width: number, height: number): Point {
  return { x: landmark.x * width, y: landmark.y * height };
}

function isVisible(landmark: Landmark | undefined): landmark is Landmark {
  return landmark != null && (landmark.visibility ?? 1) >= VISIBILITY_THRESHOLD;
}

/**
 * Scans the segmentation mask for the topmost row (smallest y) whose confidence
 * exceeds the threshold, restricted to a horizontal band around headXPx to avoid
 * picking up background clutter or hair/objects elsewhere in the frame.
 */
function findTopOfHeadFromMask(
  mask: Float32Array,
  width: number,
  height: number,
  headXPx: number,
): Point | null {
  const xMin = Math.max(0, Math.round(headXPx - HEAD_SEARCH_BAND_PX));
  const xMax = Math.min(width - 1, Math.round(headXPx + HEAD_SEARCH_BAND_PX));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = xMin; x <= xMax; x++) {
      if (mask[rowOffset + x] >= SEGMENTATION_CONFIDENCE_THRESHOLD) {
        return { x, y };
      }
    }
  }
  return null;
}

/**
 * Fallback when segmentation is unavailable: estimates head height from
 * inter-ear width and treats the eye line as roughly mid-head vertically.
 */
function estimateTopOfHeadHeuristic(
  landmarks: Landmark[],
  width: number,
  height: number,
): Point | null {
  const leftEar = landmarks[LM.LEFT_EAR];
  const rightEar = landmarks[LM.RIGHT_EAR];
  const leftEye = landmarks[LM.LEFT_EYE];
  const rightEye = landmarks[LM.RIGHT_EYE];
  if (!isVisible(leftEar) || !isVisible(rightEar) || !isVisible(leftEye) || !isVisible(rightEye)) {
    return null;
  }

  const earL = toPixel(leftEar, width, height);
  const earR = toPixel(rightEar, width, height);
  const eyeL = toPixel(leftEye, width, height);
  const eyeR = toPixel(rightEye, width, height);

  const headWidthPx = Math.hypot(earL.x - earR.x, earL.y - earR.y);
  const headHeightPx = headWidthPx * HEAD_HEIGHT_TO_WIDTH_RATIO;
  const eyeCenter: Point = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 };

  return { x: eyeCenter.x, y: eyeCenter.y - headHeightPx / 2 };
}

function findGroundPoint(landmarks: Landmark[], width: number, height: number): Point | null {
  const candidates = [
    landmarks[LM.LEFT_HEEL],
    landmarks[LM.RIGHT_HEEL],
    landmarks[LM.LEFT_FOOT_INDEX],
    landmarks[LM.RIGHT_FOOT_INDEX],
  ].filter(isVisible);

  if (candidates.length === 0) return null;

  const pixelPoints = candidates.map((lm) => toPixel(lm, width, height));
  const lowest = pixelPoints.reduce((a, b) => (b.y > a.y ? b : a));
  return lowest;
}

/**
 * Estimates total body height in pixels using a hybrid approach: the
 * segmentation mask's topmost silhouette pixel (near the head) for the top,
 * and heel/foot-index landmarks for the ground — falling back to an
 * anthropometric heuristic when segmentation is unavailable or inconclusive.
 */
export function estimateHeight(frame: PoseFrame): HeightEstimate | null {
  const { landmarks, imageWidth, imageHeight, segmentationMask } = frame;

  const ground = findGroundPoint(landmarks, imageWidth, imageHeight);
  if (!ground) return null;

  const nose = landmarks[LM.NOSE];
  const headXPx = isVisible(nose) ? toPixel(nose, imageWidth, imageHeight).x : imageWidth / 2;

  let topOfHead: Point | null = null;
  let method: HeightEstimate["method"] = "segmentation";

  if (segmentationMask) {
    topOfHead = findTopOfHeadFromMask(segmentationMask, imageWidth, imageHeight, headXPx);
  }

  if (!topOfHead) {
    topOfHead = estimateTopOfHeadHeuristic(landmarks, imageWidth, imageHeight);
    method = "heuristic";
  }

  if (!topOfHead) return null;

  const heightPx = ground.y - topOfHead.y;
  if (heightPx <= 0) return null;

  return { topOfHeadPx: topOfHead, groundPx: ground, heightPx, method };
}
