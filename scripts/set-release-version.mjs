import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const requestedVersion = process.argv[2]?.replace(/^v/i, "");
if (!/^\d+\.\d+\.\d+$/.test(requestedVersion ?? "")) {
  throw new Error("Version phải theo định dạng X.Y.Z, ví dụ: 0.1.2");
}

const root = resolve(import.meta.dirname, "..");
const tauriConfigPath = resolve(root, "src-tauri", "tauri.conf.json");
const cargoPath = resolve(root, "src-tauri", "Cargo.toml");

const tauriConfig = JSON.parse(await readFile(tauriConfigPath, "utf8"));
tauriConfig.version = requestedVersion;
await writeFile(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);

const cargoToml = await readFile(cargoPath, "utf8");
const updatedCargoToml = cargoToml.replace(
  /^(version\s*=\s*")[^"]+("\s*)$/m,
  `$1${requestedVersion}$2`,
);
if (updatedCargoToml === cargoToml) {
  throw new Error("Không tìm thấy version trong src-tauri/Cargo.toml");
}
await writeFile(cargoPath, updatedCargoToml);

console.log(`Đã đồng bộ version v${requestedVersion}.`);
