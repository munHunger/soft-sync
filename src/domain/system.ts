import { PackageManager } from "./software";

export class System {
  constructor(
    public name: string,
    public wanted: string[],
    public installed: string[],
    public manager: PackageManager[]
  ) {}
}
