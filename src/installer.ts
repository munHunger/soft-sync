import { Software } from "./domain/software";
import { logger } from "./logger";
import { spawn } from "child_process";
import { System } from "./domain/system";
import * as config from "./configuration";

export function install(application: Software, options: any) {
  logger.info(`Installing ${application.name} using ${options.manager}`);
  return application.packages
    .reduce((acc, val) => {
      return acc.then(() => {
        let alternative = val.alternatives.filter(
          alt => alt.manager === options.manager
        )[0];
        if (!alternative) {
          logger.error(
            `No available alternatives for manager ${options.manager}`,
            { data: val }
          );
          return Promise.reject();
        }
        if (options.dryRun) {
          logger.info(`dryRun: pacman -Ss ${alternative.name}`);
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          const process = spawn("pacman", ["-Ss", alternative.name]);
          process.on("exit", code => {
            logger.info(`Exited ${code}`);
            resolve();
          });
          process.on("error", data => {
            logger.error(`Failed to install package`, { data });
            reject();
          });
        });
      });
    }, Promise.resolve())
    .then(() => application);
}

export function installWanted(system: System, options: any): Promise<System> {
  let app = system.wanted.filter(app => system.installed.indexOf(app) < 0)[0];
  if (!app) return Promise.resolve(system);
  return config
    .readConfig(app)
    .then(config => install(config, { ...options, manager: system.manager }))
    .then(() => {
      system.installed.push(app);
      return system;
    })
    .then(system => installWanted(system, options));
}
