import { describe, expect, it } from "vitest";
import { estimateHeight } from "../src/measurement/height";
import { computeVitruvianOverlay } from "../src/overlay/vitruvianOverlay";
import { buildTPoseFrame } from "./fixtures";

describe("computeVitruvianOverlay", () => {
  it("sizes the square to the detected height and centers the circle on the hip midpoint", () => {
    const frame = buildTPoseFrame();
    const height = estimateHeight(frame)!;
    const geometry = computeVitruvianOverlay(frame, height)!;

    expect(geometry.square.size).toBeCloseTo(height.heightPx);
    expect(geometry.square.y).toBeCloseTo(height.topOfHeadPx.y);

    // navel = hip midpoint = ((450+550)/2, (900+900)/2) = (500, 900)
    expect(geometry.circle.center.x).toBeCloseTo(500);
    expect(geometry.circle.center.y).toBeCloseTo(900);
    // radius = ground.y - navel.y = 1950 - 900
    expect(geometry.circle.radius).toBeCloseTo(height.groundPx.y - 900);
  });

  it("returns null when hips or shoulders aren't visible", () => {
    const frame = buildTPoseFrame();
    frame.landmarks[23] = { ...frame.landmarks[23], visibility: 0 };
    frame.landmarks[24] = { ...frame.landmarks[24], visibility: 0 };

    const height = estimateHeight(frame)!;
    expect(computeVitruvianOverlay(frame, height)).toBeNull();
  });
});
