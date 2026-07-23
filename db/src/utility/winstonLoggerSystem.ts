import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";

const winstonLogDir = ".logs";
const { combine, timestamp, printf } = winston.format;

const winstonLogFormat = printf((logdata) => {
    return `${logdata.timestamp}|${logdata.level}| ${logdata.message}`;
});

type RotatingLogLevel = "info" | "error" | "warn";

function createRotatingTransport(level: RotatingLogLevel): winstonDaily {
    const transport = new winstonDaily({
        level,
        datePattern: "YYYY-MM-DD",
        dirname: `${winstonLogDir}/${level}`,
        filename: `%DATE%.${level}.log`,
        maxFiles: 30,
        zippedArchive: true,
    });

    transport.on("error", (error) => {
        console.error(`[winston:${level}] Rotating file transport failed:`, error);
    });

    return transport;
}

const rotatingTransports = (["info", "error", "warn"] as const).map(createRotatingTransport);

export const winstonLogger = winston.createLogger({
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winstonLogFormat,
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            ),
        }),
        ...rotatingTransports,
    ],
});
