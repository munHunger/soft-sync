import chalk from "chalk";
import winston from "winston";

const format = winston.format.printf(
  ({ level, message, label, timestamp, data }) => {
    level = level.toUpperCase();
    switch (level) {
      case "ERROR":
        level = chalk.redBright(level);
        break;
      case "WARN":
        level = chalk.yellow(level);
        break;
      case "INFO":
        level = chalk.green(level);
        break;
      case "DEBUG":
        level = chalk.blue(level);
        break;
    }
    if (label) label = chalk.bold(label);
    return ` [${chalk.magenta(timestamp.slice(11, 19))}] ${level} - ${
      label ? label + " - " : ""
    }${message} ${
      data
        ? "\n" +
          JSON.stringify(data, null, 2)
            .split("\n")
            .map(s => "   " + s)
            .join("\n")
        : ""
    }`;
  }
);

export const logger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), format),
  transports: [new winston.transports.Console()],
  level: 'debug'
});
