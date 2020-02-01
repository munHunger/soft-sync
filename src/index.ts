import { Software, PositionType } from "./domain/software";
import { logger } from "./logger";
import yargs from "yargs";
import { System } from "./domain/system";
import * as installer from "./installer";
import * as config from "./configuration";
import { configure } from "./configuration";

yargs.command(
  "sync [system]",
  "sync the local machine",
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
      })
      .option("force", {
        describe: "force a reinstall",
        default: false,
        type: "boolean",
        alias: "f"
      });
  },
  argv => {
    config
      .readSystem(argv.system as string)
      .then(async system => {
        logger.info("Read system info", { data: system });
        if (!system.installed || argv.force) system.installed = [];
        return installer.installWanted(system, argv);
      })
      .then(system => configure(system, argv).then(() => system))
      .then(system => config.saveConfig(argv.system as string, system));
  }
).argv;
