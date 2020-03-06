import { notEmpty, customCheck, expectFields } from "../validators/validator";

export enum PositionType {
  END,
  NON_MANAGED_END
}
export class Position {
  constructor(public type: PositionType) {}

  static validate(position: Position): Promise<Position> {
    return expectFields(position, ["type"]).then(() => position);
  }
}

class Conditional {
  constructor(public installed: string[]) {}
}

export class Setting {
  constructor(
    public path: string,
    public content: string,
    public position: Position,
    public when: Conditional
  ) {}

  static validate(setting: Setting): Promise<Setting> {
    let errors = [
      notEmpty(setting.path, "path"),
      notEmpty(setting.content, "content")
    ]
      .filter(v => v)
      .join("\n");
    if (errors.trim().length > 0) return Promise.reject(errors);
    return Position.validate(setting.position)
      .then(() =>
        expectFields(setting, ["path", "content", "position", "when"])
      )
      .then(() => setting);
  }
}

export enum PackageManager {
  APT,
  PACMAN,
  YAY,
  AURUTILS
}

export class Package {
  public name: string;
  public alternatives: PackageAlternative[];
  constructor(name: string, alternatives: PackageAlternative[]) {
    this.name = name;
    this.alternatives = alternatives;
  }

  static validate(pkg: Package): Promise<Package> {
    return Promise.all(
      (pkg.alternatives || []).map(alt => PackageAlternative.validate(alt))
    ).then(() => {
      let errors = notEmpty(pkg.alternatives, "alternatives");
      if (errors) return Promise.reject(errors);
      return Promise.resolve(pkg);
    });
  }
}

class PackageAlternative {
  constructor(public name: string, public manager: PackageManager) {}

  static validate(
    packageAlternative: PackageAlternative
  ): Promise<PackageAlternative> {
    let errors = [
      notEmpty(packageAlternative.name, "name"),
      notEmpty(packageAlternative.manager, "manager")
    ]
      .filter(v => v)
      .join("\n");
    if (errors.trim().length > 0) return Promise.reject(errors);
    return Promise.resolve(packageAlternative);
  }
}

export class Software {
  constructor(
    public name: string,
    public packages: Package[],
    public dependencies: string[],
    public settings: Setting[],
    public install: (string | Setting)[],
    public uninstall: (string | Setting)[]
  ) {}

  static validate(software: Software): Promise<Software> {
    return Promise.all(
      (software.packages || []).map(pkg => Package.validate(pkg))
    )
      .then(() => {
        return Promise.all(
          (software.install || []).map((step, i) =>
            customCheck(
              step,
              install =>
                Promise.resolve(typeof install === "string")
                  .then(
                    valid =>
                      valid ||
                      Setting.validate(install as Setting)
                        .catch(() => false)
                        .then(() => true)
                  )
                  .then(valid => !valid),
              `install[${i}] ${typeof step}`
            )
          )
        );
      })
      .then(() =>
        Promise.all(
          (software.settings || []).map(setting => Setting.validate(setting))
        )
      )
      .then(() => {
        let errors = notEmpty(software.name, "name");
        if (errors) return Promise.reject(errors);
        return Promise.resolve(software);
      });
  }
}
