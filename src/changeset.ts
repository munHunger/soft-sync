export enum ChangeAction {
  ADD,
  DELETE,
  MODIFY
}

export class Changeset {
  constructor(
    public version: Number,
    public content: String,
    public path: String,
    public action: ChangeAction
  ) {}
}
