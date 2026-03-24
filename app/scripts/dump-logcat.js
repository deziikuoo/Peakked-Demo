/**
 * Writes full `adb logcat -d` output to app/expo-android-log.txt (cross-platform).
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const outPath = path.join(__dirname, "..", "expo-android-log.txt");
try {
  const out = execFileSync("adb", ["logcat", "-d"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  fs.writeFileSync(outPath, out, "utf8");
  console.log("Wrote", outPath);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
