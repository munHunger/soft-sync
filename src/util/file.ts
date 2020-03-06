import fs from "fs";
import os from "os";

export function resolveHome(path: string) {
  return path.split("~").join(os.homedir());
}

export function createPath(path: string) {
  path = resolveHome(path);
  if (!fs.existsSync(path)) {
    const subPath = path
      .split("/")
      .slice(0, -1)
      .join("/");
    if (!fs.existsSync(subPath)) createPath(subPath);
    fs.mkdirSync(path);
  }
}
