import { Software, PositionType } from "./domain/software";
import { logger } from "./logger";
import yargs from "yargs";
import { System } from "./domain/system";
import * as installer from "./installer";
import * as config from "./configuration";
import { configure } from "./configuration";

yargs
  .command(
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
        .then(system => {
          if (!argv.dryRun) config.saveConfig(argv.system as string, system);
        })
        .then(() => logger.info(`Install Done`));
    }
  )
  .command(
    "install [system] [application]",
    "Installs an application",
    yargs => {
      yargs
        .positional("system", {
          describe: "The system to read and write config for"
        })
        .positional("application", {
          describe: "The app to install"
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
          let app = argv.application as string;
          if (system.wanted.indexOf(app) > -1)
            logger.info(`${app} is already installed`);
          else {
            logger.info(`Adding ${app} to wanted list`);
            system.wanted.push(app);
          }
          if (!system.installed || argv.force) system.installed = [];
          return installer.installWanted(system, argv);
        })
        .then(system => configure(system, argv).then(() => system))
        .then(system => {
          if (!argv.dryRun) config.saveConfig(argv.system as string, system);
        })
        .then(() => logger.info(`Install Done`));
    }
  )
  .command(
    "uninstall [system] [application]",
    "Uninstalls an application",
    yargs => {
      yargs
        .positional("system", {
          describe: "The system to read and write config for"
        })
        .positional("application", {
          describe: "The app to uninstall"
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
          let app = argv.application as string;
          if (system.installed.indexOf(app) > -1) {
            logger.info(`${app} is not installed`);
            return system;
          } else {
            logger.info(`Uninstalling ${app}`);
            system.wanted = system.wanted.filter(a => a !== app);
          }
        })
        .then(system => configure(system, argv).then(() => system))
        .then(system => {
          if (!argv.dryRun) config.saveConfig(argv.system as string, system);
        })
        .then(() => logger.info(`Uninstall Done`));
    }
  ).argv;
