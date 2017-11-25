"use strict";
/**
 * `GlaceJS` utils.
 *
 * @module
 */

var fs = require("fs");
var os = require("os");
var path = require("path");

require("colors");
var _ = require("lodash");
var argv = require("yargs").argv;
var fse = require("fs-extra");
var winston = require("winston");
/**
 * @property {string} hostname - Machine host name.
 */
module.exports.hostname = os.hostname().toLowerCase();
/**
 * Gets default value for variable among passed listed values.
 *
 * @function
 * @arg {...*} values - variable values
 * @return {*} - last specified value or null if last is undefined.
 */
module.exports.defVal = function () {
    for (var arg of arguments)
        if (typeof arg !== "undefined")
            return arg;
    return null;
};
/**
 * Capitalizes first letter of string. Doesn"t influence to case
 * of other letters.
 *
 * @function
 * @arg {string} string - string to capitalize
 * @return {string} - capitalized string
 */
module.exports.capitalize = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};
/**
 * Clears empty folders recursive.
 *
 * @function
 * @arg {string} folder - path to root folder
 */
var clearEmptyFolders = module.exports.clearEmptyFolders = folder => {
    var files = fs.readdirSync(folder);

    for (var fileName of files) {
        var filePath = path.join(folder, fileName);
        if (fs.statSync(filePath).isDirectory()) {
            clearEmptyFolders(filePath);
        };
    };
    if (!_.isEmpty(files)) {
        files = fs.readdirSync(folder);
    };
    if (_.isEmpty(files)) {
        fs.rmdirSync(folder);
    };
};
/**
 * Makes delay (sleep) during code execution.
 *
 * @function
 * @arg {number} timeout - Time to sleep, ms.
 * @arg {boolean} [blocking=false] - Flag whether sleep should be
 *  block code execution.
 * @return {Promise} - If sleep isn't blocking.
 * @return {undefined} - If sleep is blocking.
 */
module.exports.sleep = (timeout, blocking) => {
    blocking = !!blocking;
    if (blocking) {
        (ms => {
            ms += new Date().getTime();
            while (new Date() < ms) {};
        })(timeout);
    } else {
        return new Promise(resolve => {
            setTimeout(resolve, timeout);
        });
    };
};
/**
 * Composes file path from segments. If folder of file is absent, it will
 * be created.
 *
 * @function
 * @arg {...string} paths - A sequence of paths or path segments.
 * @return {string} - Composed path.
 */
module.exports.mkpath = function () {
    var result = path.resolve.apply(path, arguments);
    var dirname = path.dirname(result);
    fse.mkdirsSync(dirname);
    return result;
};
/**
 * Helper to generate request key for storage.
 *
 * @function
 * @arg {Request} req - Client request.
 * @return {string} - Request key according to its method, host, url.
 */
module.exports.getReqKey = req => req.method + "_" + req.headers.host + req.url;
/**
 * Sorts files by date in folder.
 *
 * @function
 * @arg {string} dir - Path to directory.
 * @arg {object} [opts] - Options.
 * @arg {boolean} [opts.desc=false] - Flag to reverse order.
 * @return {string[]} - Sequence of files sorted by date
 */
module.exports.filesByDate = (dir, opts) => {
    opts = opts || {};
    opts.desc = opts.desc || false;

    var filesList = fs
        .readdirSync(dir)
        .filter(filename => {
            var filePath = path.resolve(dir, filename);
            return !fs.statSync(filePath).isDirectory();
        })
        .map(filename => {
            var filePath = path.resolve(dir, filename);
            return { path: filePath,
                     time: fs.statSync(filePath).mtime.getTime() };
        })
        .sort((a, b) => a.time - b.time)
        .map(el => el.path);

    if (opts.desc) filesList.reverse();
    return filesList;
};
/**
 * Files sorted by order.
 *
 * @function
 * @arg {string} dir - Path to directory.
 * @arg {object} [opts] - Options.
 * @arg {boolean} [opts.desc=false] - Flag to reverse order.
 * @return {string[]} - Sequence of files sorted by order.
 */
module.exports.filesByOrder = (dir, opts) => {
    opts = opts || {};
    opts.desc = opts.desc || false;

    var filesList = fs
        .readdirSync(dir)
        .filter(filename => {
            var filePath = path.resolve(dir, filename);
            return !fs.statSync(filePath).isDirectory();
        })
        .map(filename => {
            return { path: path.resolve(dir, filename),
                     number: parseInt(_.split(filename, '-', 1)[0]) || 0 };
        })
        .sort((a, b) => a.number - b.number)
        .map(el => el.path);

    if (opts.desc) filesList.reverse();
    return filesList;
};
/**
 * Gets subfolders of directory.
 *
 * @function
 * @arg {string} dir - Path to directory.
 * @arg {object} [opts] - Options.
 * @arg {boolean} [opts.nameOnly=false] - Gets only folder names. By default,
 *  full paths.
 * @return {string[]} - Sequence of results.
 */
module.exports.subFolders = (dir, opts) => {
    opts = opts || {};
    opts.nameOnly = opts.nameOnly || false;

    if (!fs.existsSync(dir)) return [];

    var dirsList = fs
        .readdirSync(dir)
        .filter(filename => {
            var filePath = path.resolve(dir, filename);
            return fs.statSync(filePath).isDirectory();
        });

    if (!opts.nameOnly) {
        dirsList = dirsList.map(name => path.resolve(dir, name));
    };

    return dirsList;
}
/**
 * Returns function which switches message color.
 *
 * @function
 * @arg {object} [opts] - Options.
 * @arg {string} [opts.c1=magenta] - Color #1.
 * @arg {string} [opts.c2=cyan] - Color #2.
 * @return {function} - Function to switch color of passed text in terminal.
 */
module.exports.switchColor = opts => {
    opts = opts || {};
    var c1 = opts.c1 || "magenta";
    var c2 = opts.c2 || "cyan";

    var trigger = true;
    return function () {
        var msg = Array.from(arguments).join(" ");
        msg = msg[trigger ? c1 : c2].bold;
        trigger = !trigger;
        return msg;
    };
};
/**
 * Exits process with error printing.
 *
 * @function
 * @arg {string} source - Source of fatal error.
 * @return {function} - Function with takes error to print and exits process.
 */
module.exports.exit = source => err => {
    console.log(source + ":", err);
    process.exit(1);
};
/**
 * @prop {string} cwd - Current work directory.
 */
var cwd = module.exports.cwd = process.cwd();
/* Logger */
/**
 * @prop {Logger} logger - `GlaceJS` logger.
 */
var logger = module.exports.logger = new winston.Logger();
logger.level = argv.logLevel || "debug";
logger.add(winston.transports.File,
           { filename: path.resolve(cwd, argv.log || "glace.log"),
             json: false });
if (argv.stdoutLog) {
    logger.add(winston.transports.Console);
};
/**
 * Sets log file to logger.
 *
 * @function
 * @param {string} logFile - Name or path of log file.
 */
logger.setFile = logFile => {

    var logPath = path.resolve(cwd, logFile);
    if (!logPath.endsWith(".log")) logPath += ".log";
    fse.mkdirsSync(path.dirname(logPath));

    if (logger.transports.file) logger.remove(winston.transports.File);
    logger.add(winston.transports.File, { filename: logPath, json: false });
};
/**
 * Reset log file.
 *
 * @function
 */
logger.resetFile = () => {
    if (!logger.transports.file) return;
    var logPath = logger.transports.file.filename;
    fs.unlinkSync(logPath);
    logger.setFile(logPath);
};
/* Config */
/**
 * @prop {object} config - `GlaceJS` config.
 */
var config = module.exports.config = {};

var argsConfig = {};
var argsConfigPath = path.resolve(cwd, (argv.c || argv.config || "config.json"));

if (fs.existsSync(argsConfigPath)) {
    argsConfig = require(argsConfigPath);

    for (var key in argsConfig) {
        var val = argsConfig[key];
        argsConfig[_.camelCase(key)] = val;
    };
};
_.mergeWith(argsConfig, argv, (objVal, srcVal) => srcVal ? srcVal : objVal);
config.args = argsConfig;
