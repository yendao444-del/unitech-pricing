import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const configPath = resolve(import.meta.dirname, "..", "src-tauri", "tauri.conf.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const match = String(config.version).match(/^(\d+)\.(\d+)\.(\d+)$/);

if (!match) {
  throw new Error(`Version hiện tại không hợp lệ: ${config.version}`);
}

const [, major, minor, patch] = match;
console.log(`${major}.${minor}.${Number(patch) + 1}`);
