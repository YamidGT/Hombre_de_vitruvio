import { describe, expect, it } from "vitest";
import { estimateHeight } from "../src/measurement/height";
import { computeProportions } from "../src/measurement/proportions";
import { buildTPoseFrame } from "./fixtures";

describe("computeProportions", () => {
  it("computes each ratio as measurement-in-pixels / detected-height-in-pixels", () => {
    const frame = buildTPoseFrame();
    const height = estimateHeight(frame)!;
    const results = computeProportions(frame, height);

    const byKey = Object.fromEntries(results.map((r) => [r.key, r.actualRatio]));

    // armspan: wrist-to-wrist = |50-950| = 900
    expect(byKey.armspan).toBeCloseTo(900 / height.heightPx);
    // cubit: elbow->index, both sides = 170px
    expect(byKey.cubit).toBeCloseTo(170 / height.heightPx);
    // foot length: heel->footIndex, both sides = 50px
    expect(byKey.footLength).toBeCloseTo(50 / height.heightPx);
    // shoulder width: |400-600| = 200
    expect(byKey.shoulderWidth).toBeCloseTo(200 / height.heightPx);
    // arm length: shoulder->wrist, both sides = 350
    expect(byKey.armLength).toBeCloseTo(350 / height.heightPx);
    // head height: ear width 80 * 1.3 = 104
    expect(byKey.headHeight).toBeCloseTo(104 / height.heightPx);
  });

  it("omits a row when its landmarks aren't visible instead of fabricating a value", () => {
    const frame = buildTPoseFrame();
    // Hide the wrists so armspan can't be measured.
    frame.landmarks[15] = { ...frame.landmarks[15], visibility: 0 };
    frame.landmarks[16] = { ...frame.landmarks[16], visibility: 0 };

    const height = estimateHeight(frame)!;
    const results = computeProportions(frame, height);

    expect(results.find((r) => r.key === "armspan")).toBeUndefined();
  });
});
