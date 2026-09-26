// Copies MediaPipe's WASM runtime files from node_modules into public/wasm
// so PoseLandmarker loads them locally instead of from a CDN. Run after
// installing or upgrading @mediapipe/tasks-vision.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const src = path.join(rootDir, "node_modules/@mediapipe/tasks-vision/wasm");
const dest = path.join(rootDir, "public/wasm");

if (!existsSync(src)) {
  console.error(`sync-wasm: source not found at ${src} — is @mediapipe/tasks-vision installed?`);
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`sync-wasm: copied ${src} -> ${dest}`);
