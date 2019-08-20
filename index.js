/**
 * `GlaceJS` utils.
 *
 * @module glace-utils
 */

var fs = require("fs");
var path = require("path");
var readline = require("readline");
var util = require("util");

var colors = require("colors");
var espree = require("espree");
var highlight = require("cli-highlight").highlight;
var _ = require("lodash");
var yargs = require("yargs").help(" ");  // disable default `--help` capture
module.exports.__findProcess = require("find-process");
var fse = require("fs-extra");

/**
 * Clears empty folders recursive.
 *
 * @function
 * @arg {string} folder - Path to root folder.
 */
var clearEmptyFolders = module.exports.clearEmptyFolders = folder => {
    var files = fs.readdirSync(folder);

    for (var fileName of files) {
        var filePath = path.join(folder, fileName);
        if (fs.statSync(filePath).isDirectory()) {
            clearEmptyFolders(filePath);
        }
    }
    if (!_.isEmpty(files)) {
        files = fs.readdirSync(folder);
    }
    if (_.isEmpty(files)) {
        fs.rmdirSync(folder);
    }
};
/**
 * Makes delay (sleep) during code execution.
 *
 * @function
 * @arg {number} timeout - Time to sleep, ms.
 * @arg {boolean} [blocking=false] - Flag whether sleep should be
 *  block code execution.
 * @return {Promise<void>} If sleep isn't blocking.
 * @return {undefined} If sleep is blocking.
 */
module.exports.sleep = (timeout, blocking) => {
    blocking = !!blocking;
    if (blocking) {
        (ms => {
            ms += new Date().getTime();
            while (new Date() < ms) { /* nothing */ }
        })(timeout);
    } else {
        return new Promise(resolve => {
            setTimeout(resolve, timeout);
        });
    }
};
/**
 * Composes file path from segments. If folder of file is absent, it will
 * be created.
 *
 * @function
 * @arg {...string} paths - A sequence of paths or path segments.
 * @return {string} Composed path.
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
 * @return {string} Request key according to its method, host, url.
 */
module.exports.getReqKey = req => req.method + "_" + req.headers.host + req.url;
/**
 * Sorts files by date in folder.
 *
 * @function
 * @arg {string} dir - Path to directory.
 * @arg {object} [opts] - Options.
 * @arg {boolean} [opts.desc=false] - Flag to reverse order.
 * @return {string[]} Sequence of files sorted by date
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
 * @return {string[]} Sequence of files sorted by order.
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
                number: parseInt(_.split(filename, "-", 1)[0]) || 0 };
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
 * @return {string[]} Sequence of results.
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
    }

    return dirsList;
};
/**
 * Returns function which switches message color.
 *
 * @function
 * @arg {object} [opts] - Options.
 * @arg {string} [opts.c1=magenta] - Color #1.
 * @arg {string} [opts.c2=cyan] - Color #2.
 * @return {function} Function to switch color of passed text in terminal.
 */
const switchColor = module.exports.switchColor = opts => {
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
 * @return {function} Function with takes error to print and exits process.
 */
module.exports.exit = source => err => {
    console.log(source + ":", err);
    process.exit(1);
};
/**
 * @prop {string} cwd - Current work directory.
 */
module.exports.cwd = process.cwd();

module.exports.loadJson = require("./lib/loadJson");
module.exports.config = require("./lib/config");
module.exports.logger = require("./lib/logger");

/**
 * Wraps function inside other functions.
 *
 * @function
 * @arg {function[]} wrappers - List of functions which will wrap target.
 * @arg {function} target - Target function which will be wrapped.
 * @return {function} Wrapping function.
 */
module.exports.wrap = (wrappers, target) => {
    _.clone(wrappers).reverse().forEach(wrapper => {
        target = (target => () => wrapper(target))(target);
    });
    return target;
};
/**
 * Helper to kill processes by name.
 *
 * @async
 * @function
 * @arg {string} procName - Process name or chunk of name.
 * @return {Promise<void>}
 */
module.exports.killProcs = procName => {
    var logger = I.logger;
    logger.debug(`Looking for ${procName} processes to kill...`);

    return I.__findProcess("name", procName).then(procList => {

        return procList.forEach(proc => {

            if ([process.pid, process.ppid].includes(+proc.pid)) return;
            logger.debug(`Killing ${procName} with PID ${proc.pid}...`);

            try {
                process.kill(proc.pid, "SIGTERM");
                logger.debug("Process is killed");

            } catch (e) {
                if (e.message !== "kill ESRCH") throw e;
                logger.error(`Can't kill ${procName} with PID ${proc.pid} because it doesn't exist`);
            }
        });
    });
};
/**
 * Help
 *
 * @function
 * @arg {function} [d] - Function to manage describe message: join, colorize, etc.
 * @return {yargs} Preconfigured yargs.
 */
module.exports.help = d => {
    d = d || switchColor();
    return yargs
        .options({
            "config [path]": {
                alias: "c",
                describe: d("Path to JSON file with CLI arguments.",
                    "Default is 'cwd/config.json' (if it exists)."),
                type: "string",
                group: "Arguments:",
            },
            "stdout-log": {
                describe: d("Print log messages to stdout."),
                type: "boolean",
                group: "Log:",
            },
            "log [path]": {
                describe: d("Path to log file. Default is 'cwd/glace.log'."),
                type: "string",
                group: "Log:",
            },
            "log-level [level]": {
                describe: d("Log level. Supported values are 'error', 'warn',",
                    "'info', 'verbose', 'debug', 'silly'. Default is 'debug'."),
                type: "string",
                group: "Log:",
            },
        })
        .help("h")
        .alias("h", "help");
};
/**
 * Defines whether object is located on screen or no.
 *
 * @function
 * @arg {object} obj - Object which may be on screen.
 * @arg {object} screen - Screen object.
 * @arg {object} [opts] - Options.
 * @arg {boolean} [opts.fully=false] - Flag to check full presence on screen.
 * @return {boolean} `true` if it is on screen, `false` otherwise.
 */
module.exports.isInScreen = (obj, screen, opts) => {
    opts = I.coalesce(opts, {});
    var fully = I.coalesce(opts.fully, false);

    if (fully) {
        return ((obj.x >= screen.x) &&
                (obj.y >= screen.y) &&
                (obj.x + obj.width <= screen.x + screen.width) &&
                (obj.y + obj.height <= screen.y + screen.height));
    } else {
        return !((obj.x >= screen.x + screen.width) ||
                 (obj.y >= screen.y + screen.height) ||
                 (obj.x + obj.width <= screen.x) ||
                 (obj.y + obj.height <= screen.y));
    }
};
/**
 * Gets object position on screen.
 *
 * @function
 * @arg {object} obj - Object which should be on screen.
 * @arg {object} screen - Screen object.
 * @return {object} Object position on screen.
 * @throws {Error} If object isn't located on screen.
 */
module.exports.objOnScreenPos = (obj, screen) => {

    if (!I.isInScreen(obj, screen)) {
        throw new Error(
            `Object { x: ${obj.x}, y: ${obj.y}, width: ${obj.width}, ` +
            `height: ${obj.height} } isn't on screen { x: ${screen.x}, ` +
            `y: ${screen.y}, width: ${screen.width}, height: ${screen.height} }`);
    }

    var res = _.clone(obj);

    if (res.x < screen.x) res.x = screen.x;
    if (res.y < screen.y) res.y = screen.y;

    if (res.x + res.width > screen.x + screen.width) {
        res.width = screen.x + screen.width - res.x;
    }

    if (res.y + res.height > screen.y + screen.height) {
        res.height = screen.y + screen.height - res.y;
    }

    return res;
};
/**
 * Transforms string to kebab case. Replace all symbols, except numbers,
 *  chars and dots with dashes.
 *
 * @function
 * @arg {string} str - String to transform.
 * @return {string} Transformed string.
 */
module.exports.toKebab = str => {
    return str
        .trim()
        .toLowerCase()
        .replace(/[^A-Za-z0-9_.]+/g, "-")
        .replace(/-\./g, ".")
        .replace(/-_/g, "_")
        .replace(/-$/g, "")
        .replace(/^-/g, "");
};
/**
 * Waits for predicate returns truly value.
 *
 * @async
 * @function
 * @arg {function} predicate - Function which should return truly value during
 *  timeout.
 * @arg {object} [opts] - Options.
 * @arg {number} [opts.timeout=1] - Time to wait for predicate result, sec.
 * @arg {number} [opts.polling=0.1] - Time to poll predicate result, sec.
 * @return {Promise<boolean>} `false` if predicate didn't return truly value
 *  during expected time.
 * @return {Promise<object>} Predicate truly value.
 */
module.exports.waitFor = async (predicate, opts) => {
    opts = I.coalesce(opts, {});
    var timeout = I.coalesce(opts.timeout, 1) * 1000;
    var polling = I.coalesce(opts.polling, 0.1) * 1000;
    var limit = new Date().getTime() + timeout;

    while(limit > new Date().getTime()) {
        var result = await predicate();
        if (result) return result;
        await I.sleep(polling);
    }

    return false;
};

/**
 * Waits during a time that predicate returns truly value.
 *
 * @async
 * @function
 * @arg {function} predicate - Function which should return truly value during
 *  timeout.
 * @arg {object} [opts] - Options.
 * @arg {number} [opts.timeout=1] - Time to wait predicate result, sec.
 * @arg {number} [opts.polling=0.1] - Time to poll predicate result, sec.
 * @return {Promise<boolean>} `false` if predicate didn't return truly value
 *  during expected time.
 * @return {Promise<object>} Predicate truly value.
 */
module.exports.waitDuring = async (predicate, opts) => {

    opts = I.coalesce(opts, {});
    var timeout = I.coalesce(opts.timeout, 1) * 1000;
    var polling = I.coalesce(opts.polling, 0.1) * 1000;
    var limit = new Date().getTime() + timeout;

    while(limit > new Date().getTime()) {
        var result = await predicate();
        if (!result) return false;
        await I.sleep(polling);
    }

    return result;
};

var complete = line => {
    line = colors.strip(line);
    var tokens = line.split(/[^A-Za-z0-9._$]+/).filter(i => i);

    if (!tokens.length) return [[], line];

    var targetToken = tokens[tokens.length - 1];

    var namespace = global;
    var filterPrefix = targetToken;

    var targetObject;
    if (targetToken.includes(".")) {

        targetObject = targetToken.split(".");
        filterPrefix = targetObject.pop();
        targetObject = targetObject.join(".");

        if (!targetObject) return [[], targetToken];

        try {
            namespace = eval(targetObject);
        } catch (e) {
            return [[], targetToken];
        }
    }

    try {
        var completions = [];
        for (var key in namespace) {
            completions.push(key);
        }
        completions = _.union(
            completions,
            Object.getOwnPropertyNames(namespace),
            Object.getOwnPropertyNames(Object.getPrototypeOf(namespace))
        ).sort()
            .filter(i => i.startsWith(filterPrefix))
            .filter(i => /^(\w|\$)+$/.test(i))
            .filter(i => /^\D/.test(i));
    } catch (e) {
        return [[], targetToken];
    }

    if (targetObject) {
        completions = completions.map(i => targetObject + "." + i);
    }
    return [completions, targetToken];
};
/**
 * Interactive debugger with syntax highlighting and autocomplete.
 *
 * <img src="./debug_example.gif" title="Debug example" />
 *
 * @async
 * @function
 * @arg {string} [helpMessage] - Help message.
 * @return {Promise}
 */
module.exports.debug = async function (helpMessage) {

    const defaultHelp = "In interactive mode you can execute any nodejs code.\n" +
        "Also next commands are available:\n";

    helpMessage = helpMessage || defaultHelp;

    helpMessage += "- h, help - show interactive mode help;\n" +
        "- go - continue code execution;\n" +
        "- exit - finish current nodejs process;";

    console.log("interactive mode".yellow);

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: complete,
    });

    var ttyWrite = rl._ttyWrite;
    rl._ttyWrite = function (s, key) {

        if (this.cursor <= this.line.length) {
            this.line = colors.strip(this.line);
            if (this.cursor > this.line.length) {
                this._moveCursor(+Infinity);
            }
        }

        ttyWrite.call(this, s, key);

        if (this.cursor < this.line.length) {
            this.line = colors.strip(this.line);
            if (this.cursor > this.line.length) {
                this._moveCursor(+Infinity);
            }
        } else {
            this.line = highlight(colors.strip(this.line), { language: "js" });
            this._moveCursor(+Infinity);
        }
        if (key.name !== "return") {
            this._refreshLine();
        }
    };

    var origGlobals = {};
    var isFinished = false;

    while (!isFinished) {
        isFinished = await new Promise(resolve => {
            rl.question("> ".red, answer => {
                answer = colors.strip(answer);

                if (answer === "exit") {
                    console.log("emergency exit".red);
                    process.exit(1);
                }

                if (answer === "go") {
                    console.log("continue execution".green);
                    resolve(true);
                    return;
                }

                if (["help", "h"].includes(answer)) {
                    console.log(helpMessage);
                    resolve(false);
                    return;
                }

                var ast, varName;

                try {
                    ast = espree.parse(answer, { ecmaVersion: 9 });
                    varName = ast.body[0].expression.left.name;
                } catch (e) {
                    try {
                        varName = ast.body[0].declarations[0].id.name;
                    } catch (e) { /* nothing */ }
                }

                Promise
                    .resolve()
                    .then(() => {
                        var result = eval(answer);
                        if (varName) {
                            if (!Object.prototype.hasOwnProperty.call(origGlobals, varName)) {
                                origGlobals[varName] = global[varName];
                            }
                            global[varName] = eval(varName);
                        }
                        return result;
                    })
                    .then(result => console.log(util.format(result).yellow))
                    .catch(e => console.log(util.format(e).red))
                    .then(() => resolve(false));
            });
        });
    }

    for (var [k, v] of Object.entries(origGlobals)) {
        global[k] = v;
    }
};
/**
 * Activates docstring support for js functions.
 *
 * @function
 */
module.exports.docString = () => {
    if (Object.prototype.hasOwnProperty.call(Function.prototype, "__doc__")) return;
    require("docstring");

    Function.prototype.bond = function (ctx) {
        var result = this.bind(ctx);
        Object.defineProperty(result, "__doc__", {
            value: this.__doc__,
            writable: false,
        });
        return result;
    };
};

/**
 * `Glace` fixtures factory.
 *
 * Provides easy way to make a fixture with hooks related with shared context.
 *
 * @function
 * @arg {object} [opts] - Options.
 * @arg {function} [opts.before] - Callback of `before` hook.
 * @arg {function} [opts.after] - Callback of `after` hook.
 * @arg {function} [opts.beforeChunk] - Callback of `beforeChunk` hook.
 * @arg {function} [opts.afterChunk] - Callback of `afterChunk` hook.
 * @return {function} - Fixture.
 */
module.exports.makeFixture = (opts = {}) => {
    return func => {
        const ctx = {};
        if (opts.before) before(opts.before(ctx));
        if (opts.beforeChunk) beforeChunk(opts.beforeChunk(ctx));
        func();
        if (opts.afterChunk) afterChunk(opts.afterChunk(ctx));
        if (opts.after) after(opts.after(ctx));
    };
};

Object.assign(exports, require("./lib/small"));

module.exports.download = require("./lib/download");
module.exports.Pool = require("./lib/pool");

const I = module.exports;
