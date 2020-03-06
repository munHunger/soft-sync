import { promises as fs } from "fs";
import { notEmpty } from "../validators/validator";
import { createPath, resolveHome } from "../util/file";

export class SyncSettings {
  constructor(public folderPath: string) {}

  static load(): Promise<SyncSettings> {
    return fs
      .readFile(resolveHome(`~/.config/soft-sync/settings.json`), "utf-8")
      .then(data => JSON.parse(data))
      .then(data => data as SyncSettings)
      .then(sync => this.validate(sync));
  }

  static save(sync: SyncSettings): Promise<void> {
    createPath(`~/.config/soft-sync`);
    return fs.writeFile(
      resolveHome(`~/.config/soft-sync/settings.json`),
      JSON.stringify(sync, null, 2)
    );
  }

  static validate(sync: SyncSettings): Promise<SyncSettings> {
    let errors = notEmpty(sync.folderPath, "folderPath");
    if (errors) return Promise.reject(errors);
    return Promise.resolve(sync);
  }
}
