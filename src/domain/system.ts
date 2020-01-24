enum PackageManager {
    PACMAN, YAY
}

export class System {
    constructor(
        public name: string,
        public wanted: string[],
        public installed: string[],
        public manager: PackageManager
    ) {}
}