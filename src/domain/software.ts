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
  constructor(
    public path: string,
    public content: string,
    public position: Position,
    public when: Conditional
  ) {}
}

export enum PackageManager {
  APT,
  PACMAN,
  YAY,
  AURUTILS
}

export class Package {
  constructor(public name: string, public alternatives: PackageAlternative[]) {}
}

class PackageAlternative {
  constructor(public name: string, public manager: PackageManager) {}
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
}
