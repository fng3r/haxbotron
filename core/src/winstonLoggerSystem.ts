import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';

const winstonLogDir = '.logs';  // where log files saved

const { combine, timestamp, printf } = winston.format;

// log format define
const winstonLogFormat = printf(logdata => {
    return `${logdata.timestamp}|${logdata.level}| ${logdata.message}`;
});

type RotatingLogLevel = 'info' | 'error' | 'warn';

function createRotatingTransport(level: RotatingLogLevel): winstonDaily {
    const transport = new winstonDaily({
        level,
        datePattern: 'YYYY-MM-DD',
        dirname: `${winstonLogDir}/${level}`,
        filename: `%DATE%.${level}.log`,
        maxFiles: 30,
        zippedArchive: true,
    });

    // Version 5 emits low-level filesystem failures instead of swallowing them.
    // Do not send these through Winston, which could recurse into the failed transport.
    transport.on('error', error => {
        console.error(`[winston:${level}] Rotating file transport failed:`, error);
    });

    return transport;
}

const rotatingTransports = (['info', 'error', 'warn'] as const).map(createRotatingTransport);

// Log Level (lower level means more high priority)
// error 0, warn 1, info 2, http 3, verbose 4, debug 5, silly 6
export const winstonLogger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winstonLogFormat,
    ),
    transports: [
        // console part
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),  // make it colorful
                winston.format.simple(),  // `${info.level}: ${info.message} JSON.stringify({ ...rest })`
            )
        }),
        ...rotatingTransports,
    ]
});
