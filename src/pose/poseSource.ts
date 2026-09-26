import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import type { Landmark, PoseFrame } from "../measurement/types";
import { getImagePoseLandmarker, getVideoPoseLandmarker } from "./landmarker";

/**
 * A source of pose detections. ImagePoseSource is one-shot (a still photo).
 * VideoPoseSource is polled repeatedly (once per animation frame) by the
 * live-camera loop. Both produce the same PoseFrame shape, so measurement/,
 * overlay/, and ui/ don't care which one fed them.
 */
export interface PoseSource {
  detect(): Promise<PoseFrame | null>;
}

function toPoseFrame(
  result: PoseLandmarkerResult,
  imageWidth: number,
  imageHeight: number,
): PoseFrame | null {
  const rawLandmarks = result.landmarks[0];
  if (!rawLandmarks || rawLandmarks.length === 0) return null;

  const landmarks: Landmark[] = rawLandmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility,
  }));

  const mask = result.segmentationMasks?.[0];
  const segmentationMask = mask ? mask.getAsFloat32Array() : undefined;

  return { landmarks, imageWidth, imageHeight, segmentationMask };
}

export class ImagePoseSource implements PoseSource {
  private readonly image: ImageBitmap;

  constructor(image: ImageBitmap) {
    this.image = image;
  }

  async detect(): Promise<PoseFrame | null> {
    const landmarker = await getImagePoseLandmarker();
    const result = landmarker.detect(this.image);
    return toPoseFrame(result, this.image.width, this.image.height);
  }
}

export class VideoPoseSource implements PoseSource {
  private readonly video: HTMLVideoElement;

  constructor(video: HTMLVideoElement) {
    this.video = video;
  }

  async detect(): Promise<PoseFrame | null> {
    const landmarker = await getVideoPoseLandmarker();
    const result = landmarker.detectForVideo(this.video, performance.now());
    return toPoseFrame(result, this.video.videoWidth, this.video.videoHeight);
  }
}
