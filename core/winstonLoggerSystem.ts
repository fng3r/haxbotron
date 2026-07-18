import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';

const winstonLogDir = '.logs';  // where log files saved

const { combine, timestamp, printf } = winston.format;

// log format define
const winstonLogFormat = printf(logdata => {
    return `${logdata.timestamp}|${logdata.level}| ${logdata.message}`;
});

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

        // daily save part
        // setting for file includes 'info' level logs
        new winstonDaily({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: winstonLogDir + '/info', // 'info' log file saved under /info directory
            filename: `%DATE%.info.log`,
            maxFiles: 30, // 30days
            zippedArchive: true,
        }),
        // setting for file includes 'error' level logs
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: winstonLogDir + '/error',  // 'error' log file saved under /error directory
            filename: `%DATE%.error.log`,
            maxFiles: 30, // 30days
            zippedArchive: true,
        }),
        // setting for file includes 'warn' level logs
        new winstonDaily({
            level: 'warn',
            datePattern: 'YYYY-MM-DD',
            dirname: winstonLogDir + '/warn',  // 'warn' log file saved under /warn directory
            filename: `%DATE%.warn.log`,
            maxFiles: 30, // 30days
            zippedArchive: true,
        }),
    ]
});
