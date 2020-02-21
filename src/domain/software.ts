import {
  IsNotEmpty,
  IsInstance,
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
  ValidateNested,
  ValidationSchema,
  registerSchema
} from "class-validator";
import { notEmpty, customCheck } from "../validators/validator";

export enum PositionType {
  END,
  NON_MANAGED_END
}
class Position {
  constructor(public type: PositionType) {}
}

class Conditional {
  constructor(public installed: string[]) {}
}

export class Setting {
  @IsNotEmpty()
  public path: string;
  @IsNotEmpty()
  public content: string;
  public position: Position;
  public when: Conditional;
  constructor(
    path: string,
    content: string,
    position: Position,
    when: Conditional
  ) {
    this.path = path;
    this.content = content;
    this.position = position;
    this.when = when;
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
    if (errors) return Promise.reject(errors);
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
    ).then(() => {
      let errors = [notEmpty(software.name, "name"),
    customCheck()];

      if (errors) return Promise.reject(errors);
      return Promise.resolve(software);
    });
  }
}
