import { PackageManager } from "./software";
import { ArrayNotEmpty, Length } from "class-validator";
export class System {
  @ArrayNotEmpty()
  public manager: PackageManager[];
  @Length(1)
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
