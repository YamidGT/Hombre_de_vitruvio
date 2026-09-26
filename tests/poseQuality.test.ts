import { describe, expect, it } from "vitest";
import { isVitruvianPoseReady } from "../src/measurement/poseQuality";
import { buildTPoseFrame } from "./fixtures";
import { LM } from "../src/pose/landmarkIndices";

describe("isVitruvianPoseReady", () => {
  it("is false when arms are level and extended but legs are together", () => {
    const frame = buildTPoseFrame();
    // Base fixture: ankles are stacked directly under the hips (100px apart,
    // same as hip width) — a "T", not a wide stance.
    expect(isVitruvianPoseReady(frame)).toBe(false);
  });

  it("is true when arms are extended and legs are also spread wide", () => {
    const frame = buildTPoseFrame();
    const width = frame.imageWidth;
    frame.landmarks[LM.LEFT_ANKLE] = { x: 350 / width, y: 1880 / frame.imageHeight, z: 0, visibility: 1 };
    frame.landmarks[LM.RIGHT_ANKLE] = { x: 650 / width, y: 1880 / frame.imageHeight, z: 0, visibility: 1 };

    expect(isVitruvianPoseReady(frame)).toBe(true);
  });

  it("is false when a required landmark is not visible", () => {
    const frame = buildTPoseFrame();
    const width = frame.imageWidth;
    frame.landmarks[LM.LEFT_ANKLE] = { x: 350 / width, y: 1880 / frame.imageHeight, z: 0, visibility: 1 };
    frame.landmarks[LM.RIGHT_ANKLE] = { x: 650 / width, y: 1880 / frame.imageHeight, z: 0, visibility: 0.1 };

    expect(isVitruvianPoseReady(frame)).toBe(false);
  });

  it("is false when the wrists are extended but raised above shoulder height", () => {
    const frame = buildTPoseFrame();
    const width = frame.imageWidth;
    const height = frame.imageHeight;
    frame.landmarks[LM.LEFT_ANKLE] = { x: 350 / width, y: 1880 / height, z: 0, visibility: 1 };
    frame.landmarks[LM.RIGHT_ANKLE] = { x: 650 / width, y: 1880 / height, z: 0, visibility: 1 };
    // Raise the wrists well above the shoulders (arms up in a "V", not level).
    frame.landmarks[LM.LEFT_WRIST] = { x: 50 / width, y: 50 / height, z: 0, visibility: 1 };
    frame.landmarks[LM.RIGHT_WRIST] = { x: 950 / width, y: 50 / height, z: 0, visibility: 1 };

    expect(isVitruvianPoseReady(frame)).toBe(false);
  });
});
