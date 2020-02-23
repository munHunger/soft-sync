import { PackageManager } from "./software";
export class System {
  public manager: PackageManager[];
  public name: string;

  public wanted: string[];
  public installed: string[];

  constructor(
    name: string,
    wanted: string[],
    installed: string[],
    manager: PackageManager[]
  ) {
    this.name = name;
    this.wanted = wanted;
    this.installed = installed;
    this.manager = manager;
  }
}
