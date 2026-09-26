import { LM } from "../src/pose/landmarkIndices";
import type { Landmark, PoseFrame } from "../src/measurement/types";

/** A pixel-space point, normalized by the caller-provided image size when building landmarks. */
export interface PxPoint {
  x: number;
  y: number;
}

/**
 * Builds a full 33-landmark array (all visible, all pixel positions normalized
 * by width/height) from a partial override map keyed by landmark index. Any
 * index not overridden defaults to (0, 0) — fine since tests only assert on
 * landmarks they explicitly set.
 */
export function buildLandmarks(
  overrides: Partial<Record<number, PxPoint>>,
  width: number,
  height: number,
): Landmark[] {
  const landmarks: Landmark[] = [];
  for (let i = 0; i < 33; i++) {
    const px = overrides[i] ?? { x: 0, y: 0 };
    landmarks.push({ x: px.x / width, y: px.y / height, z: 0, visibility: 1 });
  }
  return landmarks;
}

/** A symmetric T-pose stick figure with known pixel coordinates, for exact-value assertions. */
export function buildTPoseFrame(width = 1000, height = 2000): PoseFrame {
  const px: Partial<Record<number, PxPoint>> = {
    [LM.NOSE]: { x: 500, y: 150 },
    [LM.LEFT_EYE]: { x: 480, y: 140 },
    [LM.RIGHT_EYE]: { x: 520, y: 140 },
    [LM.LEFT_EAR]: { x: 460, y: 150 },
    [LM.RIGHT_EAR]: { x: 540, y: 150 },
    [LM.LEFT_SHOULDER]: { x: 400, y: 300 },
    [LM.RIGHT_SHOULDER]: { x: 600, y: 300 },
    [LM.LEFT_ELBOW]: { x: 200, y: 300 },
    [LM.RIGHT_ELBOW]: { x: 800, y: 300 },
    [LM.LEFT_WRIST]: { x: 50, y: 300 },
    [LM.RIGHT_WRIST]: { x: 950, y: 300 },
    [LM.LEFT_INDEX]: { x: 30, y: 300 },
    [LM.RIGHT_INDEX]: { x: 970, y: 300 },
    [LM.LEFT_HIP]: { x: 450, y: 900 },
    [LM.RIGHT_HIP]: { x: 550, y: 900 },
    [LM.LEFT_KNEE]: { x: 450, y: 1400 },
    [LM.RIGHT_KNEE]: { x: 550, y: 1400 },
    [LM.LEFT_ANKLE]: { x: 450, y: 1880 },
    [LM.RIGHT_ANKLE]: { x: 550, y: 1880 },
    [LM.LEFT_HEEL]: { x: 450, y: 1900 },
    [LM.RIGHT_HEEL]: { x: 550, y: 1900 },
    [LM.LEFT_FOOT_INDEX]: { x: 450, y: 1950 },
    [LM.RIGHT_FOOT_INDEX]: { x: 550, y: 1950 },
  };

  return {
    landmarks: buildLandmarks(px, width, height),
    imageWidth: width,
    imageHeight: height,
  };
}
