export enum PositionType {
    END
}
class Position {
    constructor(
        public type: PositionType
    ) {}
}

class Conditional {
    constructor(
        public installed: string[]
    ) {}
}

export class Setting {
    constructor(
        public path: string,
        public content: string,
        public position: Position,
        public when: Conditional
    ) {}
}

enum PackageManager {
    APT, PACMAN, YAY
}

class Package {
    constructor(
        public name: string,
        public alternatives: PackageAlternative[]
    ) {}
}

class PackageAlternative {
    constructor(
        public name: string,
        public manager: PackageManager
    ) {}
}

export class Software {
    constructor(
        public name: string,
        public packages: Package[],
        public dependencies: string[],
        public settings: Setting[]
    ) {}
}