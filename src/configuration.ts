import { promises as fs } from "fs";
import { System } from "./domain/system";
import yaml from "js-yaml";
import { logger } from "./logger";
import { Software, PositionType } from "./domain/software";
import { SyncSettings } from "./domain/sync";
import { resolveHome } from "./util/file";

export function saveConfig(name: string, system: System): Promise<void> {
  return SyncSettings.load().then((sync) =>
    fs.writeFile(
      resolveHome(`${sync.folderPath}/${name}.yml`),
      yaml.dump(system)
    )
  );
}

export function readSystem(name: string): Promise<System> {
  return SyncSettings.load().then((sync) =>
    fs
      .readFile(resolveHome(`${sync.folderPath}/${name}.yml`), "utf-8")
      .then((data) => yaml.load(data))
      .then((data) => data as System)
  );
}

function readTheme(name: string): Promise<any> {
  return SyncSettings.load().then((sync) =>
    fs
      .readFile(resolveHome(`${sync.folderPath}/theme/${name}.yml`), "utf-8")
      .then((data) => yaml.load(data))
  );
}

export function readConfig(name: string): Promise<Software> {
  return SyncSettings.load().then((sync) => {
    return fs
      .readFile(resolveHome(`${sync.folderPath}/software/${name}.yml`), "utf-8")
      .then((data) => yaml.load(data))
      .then((data) => data as Software)
      .then((software) => Software.validate(software))
      .catch((err) => {
        logger.error(`error reading config for ${name}`);
        throw err;
      });
  });
}

export function readConfigForApps(names: string[]): Promise<any[]> {
  return names
    .map((name) => ({ name, config: readConfig(name) }))
    .reduce(
      (acc, val) =>
        acc.then((d) =>
          val.config.then((config) => d.concat({ name: val.name, config }))
        ),
      Promise.resolve([])
    );
}

export function generateInstallList(system: System): Promise<string[]> {
  return Promise.all(
    []
      .concat(system.installed)
      .concat(system.wanted)
      .map((app) =>
        readConfig(app).then((appConf) => [app].concat(appConf.dependencies))
      )
  ).then((apps) =>
    [...new Set(apps.reduce((acc, val) => acc.concat(val), []))].filter(
      (a) => a
    )
  );
}

function flattenObject(obj: any): any {
  let toReturn: any = {};

  for (let i in obj) {
    if (!obj.hasOwnProperty(i)) continue;

    if (typeof obj[i] === "object") {
      let flatObject = flattenObject(obj[i]);
      for (let x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        toReturn[i + "." + x] = flatObject[x];
      }
    } else {
      toReturn[i] = obj[i];
    }
  }
  return toReturn;
}

function themeSetting(setting: string, theme: any, themeName: string) {
  let variableRegex = /{:.*?}/gm;
  if (variableRegex.test(setting)) {
    logger.debug("found variable");
    [...setting.match(variableRegex)].forEach((m) => {
      let name = m.slice(2, -1);
      logger.debug(`Found variable in setting ${m}`);
      if (!theme[name])
        logger.warn(`could not find variable ${name} in theme ${themeName}`, {
          data: theme,
        });
      else {
        logger.debug(`replacing variable ${m} in theme with ${theme[name]}`);
        setting = setting.replace(m, theme[name]);
      }
    });
  }
  return setting;
}

export function configure(system: System, options: any): Promise<any> {
  return generateInstallList(system).then((installList) => {
    return Promise.all(
      installList.map((name) =>
        readConfig(name).then((data) => ({ ...data, name }))
      )
    ).then((settings) => {
      return (system.theme
        ? readTheme(system.theme).then((theme) => flattenObject(theme))
        : Promise.resolve({})
      ).then((theme) => {
        let virtualSettings: any = {};
        settings
          .map((s) => s.settings)
          .reduce((acc, val) => acc.concat(val), [])
          .filter((s) => s)
          .filter((setting) => !setting.when)
          .forEach((setting) => {
            setting.content = themeSetting(
              setting.content,
              theme,
              system.theme
            );
            virtualSettings[setting.path] = setting.content;
          });

        settings
          .map((s) => s.settings)
          .reduce((acc, val) => acc.concat(val), [])
          .filter((s) => s)
          .filter(
            (setting) =>
              setting.when &&
              setting.when.installed.every(
                (pkg) => installList.indexOf(pkg) > -1
              )
          )
          .forEach((setting) => {
            if (
              (PositionType as any)[setting.position.type] === PositionType.END
            ) {
              logger.debug(`Adding settings to ${setting.path}`);
              setting.content = themeSetting(
                setting.content,
                theme,
                system.theme
              );
              virtualSettings[setting.path] += "\n" + setting.content;
            }
          });
        logger.debug("Virtual conf generated", { data: virtualSettings });
        return Promise.resolve(virtualSettings);
      });
    });
  });
}
