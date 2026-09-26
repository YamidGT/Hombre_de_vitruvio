import { describe, expect, it } from "vitest";
import { estimateHeight } from "../src/measurement/height";
import { buildTPoseFrame, buildLandmarks } from "./fixtures";
import { LM } from "../src/pose/landmarkIndices";

describe("estimateHeight", () => {
  it("falls back to the ear-width heuristic when there is no segmentation mask", () => {
    const frame = buildTPoseFrame();
    const result = estimateHeight(frame);

    expect(result).not.toBeNull();
    expect(result!.method).toBe("heuristic");
    // ear width = 80px, head height heuristic = 80 * 1.3 = 104
    // eye center y = 140, so topOfHead.y = 140 - 104/2 = 88
    expect(result!.topOfHeadPx.y).toBeCloseTo(88);
    // ground = max(heel/footIndex y) = 1950
    expect(result!.groundPx.y).toBeCloseTo(1950);
    expect(result!.heightPx).toBeCloseTo(1950 - 88);
  });

  it("uses the segmentation mask's topmost silhouette row when available", () => {
    const width = 10;
    const height = 10;
    const px = {
      [LM.NOSE]: { x: 5, y: 3 },
      [LM.LEFT_HEEL]: { x: 5, y: 9 },
      [LM.RIGHT_HEEL]: { x: 5, y: 9 },
      [LM.LEFT_FOOT_INDEX]: { x: 5, y: 9 },
      [LM.RIGHT_FOOT_INDEX]: { x: 5, y: 9 },
    };

    const mask = new Float32Array(width * height);
    // Row 2 has the silhouette's topmost visible pixels, at columns 4-6.
    mask[2 * width + 4] = 1;
    mask[2 * width + 5] = 1;
    mask[2 * width + 6] = 1;

    const frame = {
      landmarks: buildLandmarks(px, width, height),
      imageWidth: width,
      imageHeight: height,
      segmentationMask: mask,
    };

    const result = estimateHeight(frame);

    expect(result).not.toBeNull();
    expect(result!.method).toBe("segmentation");
    expect(result!.topOfHeadPx).toEqual({ x: 4, y: 2 });
    expect(result!.groundPx.y).toBeCloseTo(9);
    expect(result!.heightPx).toBeCloseTo(7);
  });

  it("returns null when no foot landmark is visible enough to anchor the ground", () => {
    const frame = buildLandmarks({}, 100, 100).map(() => ({ x: 0, y: 0, z: 0, visibility: 0 }));
    const result = estimateHeight({ landmarks: frame, imageWidth: 100, imageHeight: 100 });
    expect(result).toBeNull();
  });
});
