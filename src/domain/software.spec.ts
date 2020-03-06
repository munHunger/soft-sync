import * as underTest from "./software";

describe("Check unexpected fields", () => {
    it("fails validation on Position", async () => {
      expectAsync(
        underTest.Position.validate({
          type: underTest.PositionType.END
        } as underTest.Position)
      ).toBeResolved();
      expectAsync(
        underTest.Position.validate({
          type: underTest.PositionType.END,
          when: "a"
        } as underTest.Position)
      ).toBeRejected();
    });


  it("fails validation on Setting", async () => {
    expectAsync(
      underTest.Setting.validate({
        path: "asd",
        content: "qwe",
        position: {
            type: underTest.PositionType.END
        }
      } as underTest.Setting)
    ).toBeResolved();
    expectAsync(
        underTest.Setting.validate(JSON.parse(`{
          "path": "asd",
          "content": "qwe",
          "position": {
              "type": "END"
          },
          "qe": "qtr"
        }`) as underTest.Setting)
    ).toBeRejected();
    expectAsync(
        underTest.Setting.validate(JSON.parse(`{
          "path": "asd",
          "content": "qwe",
          "position": {
              "type": "END",
              "qe": "qtr"
          }
        }`) as underTest.Setting)
    ).toBeRejected();
    expectAsync(
        underTest.Setting.validate(JSON.parse(`{
          "path": "asd",
          "content": "qwe",
          "position": {
              "type": "END"
          }
        }`) as underTest.Setting)
    ).toBeResolved();
    expectAsync(
        underTest.Setting.validate(JSON.parse(`{
          "path": "asd",
          "content": "qwe"
        }`) as underTest.Setting)
    ).toBeResolved();
  });
});
