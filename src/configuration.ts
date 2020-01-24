import { promises as fs } from "fs";
import { System } from "./domain/system";
import yaml from "js-yaml";
import { Software } from "./domain/software";

export function saveConfig(name: string, system: System): Promise<void> {
  return fs.writeFile(`./data/${name}.yml`, yaml.dump(system));
}

export function readSystem(name: string): Promise<System> {
  return fs
    .readFile(`./data/${name}.yml`, "utf-8")
    .then(data => yaml.load(data))
    .then(data => data as System);
}

export function readConfig(name: string): Promise<Software> {
  return fs
    .readFile(`./data/software/${name}.yml`, "utf-8")
    .then(data => yaml.load(data))
    .then(data => data as Software);
}
