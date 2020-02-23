import { logger } from "../logger";

export function notEmpty(value: any, propertyName: string): string {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && (value as any[]).length === 0)
  ) {
    let err = `Property ${propertyName} must not be null or empty`;
    logger.error(err);
    return err;
  }
}

export function customCheck(
  value: any,
  checkFun: (value: any) => Promise<boolean>,
  propertyName: string
): Promise<string> {
  return (checkFun.apply({}, [value]) as Promise<boolean>).then(valid => {
    if (valid) {
      let err = `Property ${propertyName} did not pass custom check`;
      logger.error(err);
      return err;
    }
  });
}
