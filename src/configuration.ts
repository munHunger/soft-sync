import { promises as fs } from "fs";
import { System } from "./domain/system";
import yaml from "js-yaml";
import { logger } from "./logger";
import { Software, PositionType } from "./domain/software";

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
    .then(data => data as Software)
    .then(software => Software.validate(software));
}

export function readConfigForApps(names: string[]): Promise<any[]> {
  return names
    .map(name => ({ name, config: readConfig(name) }))
    .reduce(
      (acc, val) =>
        acc.then(d =>
          val.config.then(config => d.concat({ name: val.name, config }))
        ),
      Promise.resolve([])
    );
}

export function generateInstallList(system: System): Promise<string[]> {
  return Promise.all(
    []
      .concat(system.installed)
      .concat(system.wanted)
      .map(app =>
        readConfig(app).then(appConf => [app].concat(appConf.dependencies))
      )
  ).then(apps =>
    [...new Set(apps.reduce((acc, val) => acc.concat(val), []))].filter(a => a)
  );
}

export function configure(system: System, options: any): Promise<any> {
  return generateInstallList(system).then(installList => {
    logger.info(`generated install list`, { data: installList });
    return Promise.all(
      installList.map(name =>
        readConfig(name).then(data => ({ ...data, name }))
      )
    ).then(settings => {
      let virtualSettings: any = {};
      settings
        .map(s => s.settings)
        .reduce((acc, val) => acc.concat(val), [])
        .filter(s => s)
        .filter(setting => !setting.when)
        .forEach(setting => (virtualSettings[setting.path] = setting.content));

      settings
        .map(s => s.settings)
        .reduce((acc, val) => acc.concat(val), [])
        .filter(s => s)
        .filter(
          setting =>
            setting.when &&
            setting.when.installed.every(pkg => installList.indexOf(pkg) > -1)
        )
        .forEach(setting => {
          if ((<any>PositionType)[setting.position.type] === PositionType.END) {
            logger.debug(`Adding settings to ${setting.path}`);
            virtualSettings[setting.path] += "\n" + setting.content;
          }
        });
      return Promise.resolve(virtualSettings);
    });
  });
}
