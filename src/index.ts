import yaml from "js-yaml";
import { Software } from "./software";
import { logger } from "./logger";
import yargs from "yargs";
import { promises as fs } from "fs";
import { spawn } from "child_process";

yargs.command(
  "install [application]",
  "Install an application",
  yargs => {
    yargs
      .positional("application", {
        describe: "The application to install"
      })
      .option("manager", {
        describe: "Package manager used",
        default: "PACMAN",
        type: "string",
        alias: "m"
      })
      .option("dryRun", {
        describe: "Don't do any real changes",
        default: false,
        type: "boolean",
        alias: "d"
      });
  },
  argv => {
    readConfig(argv.application as string)
      .then(app => install(app, argv))
      .then(app => configure(app, argv));
  }
).argv;

function readConfig(name: string): Promise<Software> {
  return fs
    .readFile(`./data/software/${name}.yml`, "utf-8")
    .then(data => yaml.load(data))
    .then(data => data as Software);
}

function configure(application: Software, options: any) {
  if (options.dryRun) {
    application.settings.forEach(setting => {
      if (setting.when) {
        //TODO: actually check
        Promise.all(setting.when.installed.map(name => readConfig(name))).then(
          configurations => {
            let config = configurations
              .map(c => c.settings)
              .reduce((acc, val) => acc.concat(val), [])
              .map(s => s.content)
              .reduce((acc, val) => acc + val, "");
            logger.info(`Compiled virtual config \n${config}`)
          }
        );
      }
      else
      logger.info(
        `Writing configuration to ${setting.path} \n${setting.content}\n`
      );
    });
  }
}

function install(application: Software, options: any) {
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
