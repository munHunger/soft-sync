import * as configuration from "./configuration";
import sinon from "sinon";
import proxyquire from "proxyquire";
import { System } from "./domain/system";

describe("Reading", () => {
  it("parses yml for system", async () => {
    ((proxyquire.noCallThru().apply(this, [
      "./configuration",
      {
        fs: {
          promises: {
            readFile: sinon.stub().returns(
              Promise.resolve(`
            name: systemName
            manager: PACMAN
            theme: darkLeaf
            wanted:
              - a
              - b
            `)
            ),
          },
        },
        "./domain/sync": {
          SyncSettings: {
            load: sinon.stub().returns(Promise.resolve("")),
          },
        },
      },
    ]) as any).readSystem("arch") as Promise<System>).then((system) =>
      expect(system.name).toBe("systemName")
    );
  });
});

describe("Virtual config", () => {
  it("Joins configuration when conditional at END", async () => {
    let fsStub = sinon.stub();
    fsStub.withArgs(sinon.match("a.yml"), sinon.match.any).returns(
      Promise.resolve(`
    name: a
    manager: PACMAN
    theme: darkLeaf
    settings:
      - path: 1.config
        content: a
        position:
          type: END
        when:
          installed:
          - b
    `)
    );
    fsStub.withArgs(sinon.match("b.yml"), sinon.match.any).returns(
      Promise.resolve(`
    name: b
    manager: PACMAN
    theme: darkLeaf
    settings:
      - path: 1.config
        content: b
    `)
    );
    return ((proxyquire.noCallThru().apply(this, [
      "./configuration",
      {
        fs: {
          promises: {
            readFile: fsStub,
          },
        },
        "./domain/sync": {
          SyncSettings: {
            load: sinon.stub().returns(Promise.resolve("")),
          },
        },
      },
    ]) as any).configure(
      new System("name", "theme", ["a", "b"], [], []),
      {}
    ) as Promise<any>).then((config) =>
      expect(config["1.config"]).toBe("b\na")
    );
  });
});
