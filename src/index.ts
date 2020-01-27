import { Software, PositionType } from "./domain/software";
import { logger } from "./logger";
import yargs from "yargs";
import { System } from "./domain/system";
import * as installer from "./installer";
import * as config from "./configuration";

yargs.command(
  "sync [system]",
  "sync the local machine again",
  yargs => {
    yargs
      .positional("system", {
        describe: "The system to read and write config for"
      })
      .option("dryRun", {
        describe: "Don't do any real changes",
        default: false,
        type: "boolean",
        alias: "d"
      });
  },
  argv => {
    config
      .readSystem(argv.system as string)
      .then(async system => {
        logger.info("Read system info", { data: system });
        if (!system.installed) system.installed = [];
        return installer.installWanted(system, argv);
      })
      .then(system => configure(system, argv))
      .then(system => config.saveConfig(argv.system as string, system));
  }
).argv;

function configure(system: System, options: any): Promise<System> {
  Promise.all(
    (system.installed || []).map(name =>
      config.readConfig(name).then(data => ({ ...data, name }))
    )
  ).then(settings => {
    let virtualSettings: any = {};
    settings
      .map(s => s.settings)
      .reduce((acc, val) => acc.concat(val), [])
      .filter(setting => !setting.when)
      .forEach(setting => (virtualSettings[setting.path] = setting.content));
    logger.info(`Data from unconditional settings`, { data: virtualSettings });

    settings
      .map(s => s.settings)
      .reduce((acc, val) => acc.concat(val), [])
      .filter(
        setting =>
          setting.when &&
          setting.when.installed.every(
            pkg => system.installed.indexOf(pkg) > -1
          )
      )
      .forEach(setting => {
        if ((<any>PositionType)[setting.position.type] === PositionType.END) {
          logger.info(`Adding settings to ${setting.path}`);
          virtualSettings[setting.path] += "\n" + setting.content;
        }
      });
    logger.info(`Data with conditional settings`, { data: virtualSettings });
  });
  return Promise.resolve(system);
}
