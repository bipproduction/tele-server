import { readFileSync } from "fs";

export async function getAppVersion() {
  const packageJson = readFileSync("package.json");
  return JSON.parse(packageJson.toString()).version;
}
