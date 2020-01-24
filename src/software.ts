class Setting {
    constructor(
        public path: string,
        public content: string
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