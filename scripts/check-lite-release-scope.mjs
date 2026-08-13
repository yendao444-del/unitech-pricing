import { execFileSync } from "node:child_process";

const normalize = (value) => value.trim().replaceAll("\\", "/");

const allowedProductionPath = (file) =>
  file.startsWith("src/") || file === "src-tauri/src/lib.rs";

const allowedSupportPath = (file) =>
  file === "AGENTS.md" ||
  file === "release-lite.bat" ||
  file === "scripts/check-lite-release-scope.mjs" ||
  file.startsWith("tests/");

const explicitFiles = process.argv.slice(2).map(normalize).filter(Boolean);
let changedFiles = explicitFiles;

if (changedFiles.length === 0) {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], {
    encoding: "utf8",
  });
  const untracked = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  );
  changedFiles = [...tracked.split(/\r?\n/), ...untracked.split(/\r?\n/)]
    .map(normalize)
    .filter(Boolean);
}

changedFiles = [...new Set(changedFiles)];
const productionFiles = changedFiles.filter(allowedProductionPath);
const blockedFiles = changedFiles.filter(
  (file) => !allowedProductionPath(file) && !allowedSupportPath(file),
);

if (blockedFiles.length > 0) {
  console.error("[LITE BLOCKED] Co thay doi ngoai pham vi ban va nho:");
  for (const file of blockedFiles) console.error(`  - ${file}`);
  console.error("Hay dung release-patch.bat hoac release.bat cho thay doi nay.");
  process.exit(1);
}

if (productionFiles.length === 0) {
  console.error("[LITE BLOCKED] Khong co thay doi ung dung trong src/ hoac cong thuc Rust.");
  process.exit(1);
}

console.log("[LITE OK] Pham vi thay doi phu hop:");
for (const file of productionFiles) console.log(`  - ${file}`);
console.log("Updater van la NSIS EXE day du co chu ky, thuong khoang 3-4 MB.");

