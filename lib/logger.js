"use strict";

/**
 * GlaceJS logger.
 *
 * @module
 */

var fs = require("fs");
var path = require("path");

var fse = require("fs-extra");
var winston = require("winston");

var config = require("./config");

var cwd = process.cwd();

var logger;
if (global.__glaceLogger) {
    logger = global.__glaceLogger;
} else {
    /**
     * @prop {Logger} logger - `GlaceJS` logger.
     */
    logger = global.__glaceLogger = winston.createLogger({
        level: config.args.logLevel || "debug",
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(info => {
                return `${info.timestamp} ${info.level}: ${info.message}`;
            }),
        ),
    });
    logger.add(new winston.transports.File({
        filename: path.resolve(cwd, config.args.log || "glace.log"),
    }));
    if (config.args.stdoutLog) {
        logger.add(new winston.transports.Console());
    }
    /**
     * Sets log file to logger.
     *
     * @function
     * @arg {string} logFile - Name or path of log file.
     */
    logger.setFile = logFile => {

        var logPath = path.resolve(cwd, logFile);
        if (!logPath.endsWith(".log")) logPath += ".log";
        fse.mkdirsSync(path.dirname(logPath));

        if (logger._file) logger.remove(logger._file);
        logger._file = new winston.transports.File({ filename: logPath });
        logger.add(logger._file);
    };
    /**
     * Gets log file.
     *
     * @function
     * @return {?string} Path to log file or `null`.
     */
    logger.getFile = () => {
        if (!logger._file) return null;
        return path.resolve(logger._file.dirname, logger._file.filename);
    };
    /**
     * Resets log file.
     *
     * @function
     */
    logger.resetFile = () => {
        var logPath = logger.getFile();
        if (!logPath) return;
        fs.unlinkSync(logPath);
        logger.setFile(logPath);
    };
}

module.exports = logger;
