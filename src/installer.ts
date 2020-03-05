import { Software, PackageManager, Package, Setting } from "./domain/software";
import { logger } from "./logger";
import { System } from "./domain/system";
import * as config from "./configuration";
import * as exec from "child_process";

export function uninstall(
  application: Software,
  system: System,
  options: any
): Promise<Software> {
  logger.info(`Uninstalling ${application.name} using ${options.manager}`);
  return uninstallScript(application, system, options)
    .then(() => uninstallPackages(application.packages || [], options))
    .then(() => application);
}

export function install(
  application: Software,
  system: System,
  options: any
): Promise<Software> {
  logger.info(`Installing ${application.name} using ${options.manager}`);
  return installScript(application, system, options)
    .then(() => installPackages(application.packages || [], options))
    .then(() => (application.settings || []).forEach(setting => writeConfig(setting, options)))
    .then(() => application);
}

function installScript(
  application: Software,
  system: System,
  options: any
): Promise<void> {
  return (application.install || []).reduce((acc, step) => {
    if (typeof step === "string") {
      return acc.then(() => {
        logger.info(`Step is a script`);
        if (options.dryRun) {
          logger.info(`dryRun: \n${step}`);
          return Promise.resolve();
        }
        runScriptAsNonRoot(step);
        return Promise.resolve();
      });
    }

    return acc.then(() => {
      logger.info(`Step is not a script`, { data: step });
      return config.configure(system, options).then(virtualConf => {
        logger.info(`System configured`, { data: virtualConf });
        let setting = step as Setting;
        logger.info(
          `writing settings for ${setting.path}\n${virtualConf[setting.path]}`
        );
        let script = `conf=$(cat << virtualConf\n${
          virtualConf[setting.path]
          }\nvirtualConf\n); echo "$conf" | sudo tee ${setting.path}`;
        if (!options.dryRun) {
          runScriptAsNonRoot(script);
        } else logger.info(`dryRun: \n${script}`);
      });
    });
  }, Promise.resolve());
}

function writeConfig(setting: Setting, options: any) {
  installConfig(setting.path, setting.content, options);
}

export function installConfig(path: string, content: string, options: any) { // TODO: Needs to be able to create folder if not exists
  logger.info(`writing setting for ${path}`);
  let script = `conf=$(cat << virtualConf\n${content}\nvirtualConf\n); echo "$conf" | sudo tee ${path}`;
  if (!options.dryRun) {
    runScriptAsNonRoot(script);
  }
  else
    logger.info(`dryRun: \n${script}`);
}

function uninstallScript(
  application: Software,
  system: System,
  options: any
): Promise<void> {
  return (application.uninstall || []).reduce((acc, step) => {
    if (typeof step === "string") {
      return acc.then(() => {
        if (options.dryRun) {
          logger.info(`dryRun: \n${step}`);
          return Promise.resolve();
        }
        runScriptAsNonRoot(step);
        return Promise.resolve();
      });
    }
    return Promise.reject("removing settings not yet supported");
  }, Promise.resolve());
}

function runScriptAsNonRoot(script: string) {
  logger.debug(`Running script \n${script}`);
  exec.execSync(script, {
    stdio: "inherit"
  });
}

function installPackages(packages: Package[], options: any): Promise<void> {
  return packages.reduce((acc, val) => {
    return acc.then(() => {
      let alternative = val.alternatives.filter(
        alt => options.manager.indexOf(alt.manager) > -1
      )[0];
      if (!alternative) {
        logger.error(
          `No available alternatives for package ${val.name} with managers ${options.manager}`,
          { data: val }
        );
        return Promise.reject();
      }
      if (options.dryRun) {
        logger.info(
          `dryRun: ${getInstallCommand(alternative.name, alternative.manager)}`
        );
        return Promise.resolve();
      }

      runScriptAsNonRoot(
        getInstallCommand(alternative.name, alternative.manager)
      );
      return Promise.resolve();
    });
  }, Promise.resolve());
}

function uninstallPackages(packages: Package[], options: any): Promise<void> {
  return packages.reduce((acc, val) => {
    return acc.then(() => {
      let alternative = val.alternatives.filter(
        alt => options.manager.indexOf(alt.manager) > -1
      )[0];
      if (!alternative) {
        logger.error(
          `No available alternatives for package ${val.name} with managers ${options.manager}`,
          { data: val }
        );
        return Promise.reject();
      }
      if (options.dryRun) {
        logger.info(
          `dryRun: ${getUninstallCommand(
            alternative.name,
            alternative.manager
          )}`
        );
        return Promise.resolve();
      }

      runScriptAsNonRoot(
        getUninstallCommand(alternative.name, alternative.manager)
      );
      return Promise.resolve();
    });
  }, Promise.resolve());
}

function getUninstallCommand(app: string, manager: PackageManager) {
  switch ((PackageManager as any)[manager]) {
    case PackageManager.AURUTILS:
    case PackageManager.PACMAN:
      return `sudo pacman -R ${app} --noconfirm`;
    case PackageManager.YAY:
      return `yay -R ${app}`;
    default:
      logger.error(`The manager ${manager} is currently not supported`);
  }
}

function getInstallCommand(app: string, manager: PackageManager) {
  switch ((PackageManager as any)[manager]) {
    case PackageManager.PACMAN:
      return `sudo pacman -S ${app} --noconfirm --needed`;
    case PackageManager.YAY:
      return `yay -S ${app}`;
    case PackageManager.AURUTILS:
      return `aur sync -c ${app} && sudo pacman -Syu && sudo pacman -S ${app}`;
    default:
      logger.error(`The manager ${manager} is currently not supported`);
  }
}

export function installWanted(system: System, options: any): Promise<System> {
  return config.generateInstallList(system).then(installList =>
    config
      .readConfigForApps(
        installList.filter(app => system.installed.indexOf(app) < 0)
      )
      .then(apps =>
        apps.filter(app =>
          ((app.config as Software).dependencies || []).every(
            dep => system.installed.indexOf(dep) > -1
          )
        )
      )
      .then(app => app[0])
      .then(app => {
        if (!app) return Promise.resolve(system);
        app = app.name as string;
        return config
          .readConfig(app)
          .then(conf =>
            install(conf, system, { ...options, manager: system.manager })
          )
          .then(() => {
            system.installed.push(app);
            return system;
          })
          .then(sys => installWanted(sys, options));
      })
  );
}
