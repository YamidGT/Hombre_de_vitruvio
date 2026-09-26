import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

// Self-hosted (copied from node_modules by `npm run sync-wasm`, see package.json)
// so pose detection doesn't depend on a third-party CDN being reachable.
const WASM_BASE_URL = "/wasm";

// The trained model files have no self-hosted copy (a few MB each); they're
// fetched once from Google's CDN on first load and contain no user data.
const FULL_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";
const LITE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let imageLandmarkerPromise: Promise<PoseLandmarker> | null = null;
let videoLandmarkerPromise: Promise<PoseLandmarker> | null = null;

async function createLandmarker(
  modelAssetPath: string,
  runningMode: "IMAGE" | "VIDEO",
): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath },
    runningMode,
    numPoses: 1,
    outputSegmentationMasks: true,
  });
}

/** Full-accuracy model, one-shot IMAGE mode — used for static photo analysis. */
export function getImagePoseLandmarker(): Promise<PoseLandmarker> {
  if (!imageLandmarkerPromise) {
    imageLandmarkerPromise = createLandmarker(FULL_MODEL_URL, "IMAGE");
  }
  return imageLandmarkerPromise;
}

/** Lighter model, VIDEO mode — speed matters more than max accuracy in the live-camera loop. */
export function getVideoPoseLandmarker(): Promise<PoseLandmarker> {
  if (!videoLandmarkerPromise) {
    videoLandmarkerPromise = createLandmarker(LITE_MODEL_URL, "VIDEO");
  }
  return videoLandmarkerPromise;
}
