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
    logger = global.__glaceLogger = new winston.Logger();
    logger.level = config.args.logLevel || "debug";
    logger.add(winston.transports.File,
        { filename: path.resolve(cwd, config.args.log || "glace.log"),
            json: false });
    if (config.args.stdoutLog) {
        logger.add(winston.transports.Console);
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

        if (logger.transports.file) logger.remove(winston.transports.File);
        logger.add(winston.transports.File, { filename: logPath, json: false });
    };
    /**
     * Gets log file.
     *
     * @function
     * @return {?string} Path to log file or `null`.
     */
    logger.getFile = () => {
        if (!logger.transports.file) return null;
        return path.resolve(cwd, logger.transports.file.filename);
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
