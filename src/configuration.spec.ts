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
            wanted:
              - a
              - b
            `)
            )
          }
        }
      }
    ]) as any).readSystem("arch") as Promise<System>).then(system =>
      expect(system.name).toBe("systemName")
    );
  });
});
