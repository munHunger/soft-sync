import { Changeset, ChangeAction } from "./changeset";

const set = new Changeset(0, "Hello world", "/dev/null", ChangeAction.ADD);
set.version = 0;

console.log("Hello World! " + set.version);
