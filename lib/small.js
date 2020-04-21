/**
 * Functions & classes, which content is trivial or|and doesn't require
 * complex implementation (<10 SLOC mostly).
 *
 * @module
 */

const os = require("os");
const util = require("util");

require("colors");
const _ = require("lodash");
const BaseError = require("es6-error");
const findProcess = require("find-process");

const logger = require("./logger");

/**
 * Creates a new instance of `glacejs` error.
 *
 * @memberOf module:glace-utils
 * @class
 * @classdesc A base class for exceptions and errors, which are raised by
 * `glacejs` framework or its plugins. Any `glacejs` exception should be
 * inherited from this class for good style.
 * @arg {string} message - Error message.
 */
const GlaceError = function (message) {
    BaseError.call(this, message);
};
util.inherits(GlaceError, BaseError);

/**
 * @memberOf module:glace-utils
 * @property {string} hostname - Host name of machine where `glacejs` framework is
 * launched. Despite of machine hostname can be changed during script execution
 * the probability that hostname will be changed during tests execution is low.
 * That's why it's kept as property and in low case, because hostname is case
 * insensitive.
 */
const hostname = os.hostname().toLowerCase();

/**
 * @prop {string} cwd - Current work directory.
 */
const cwd = process.cwd();

/**
 * Pick default value for variable among listed values.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {...*} values - Sequence of variable values.
 * @return {*} First defined value or `null` if no one is defined.
 *
 * @example
 * U.coalesce(); // null
 * U.coalesce(undefined); // null
 * U.coalesce(undefined, 1); // 1
 * U.coalesce(undefined, 1, 2); // 1
 * U.coalesce(null, 1); // null
 */
const coalesce = function () {
    for (const arg of arguments)
        if (typeof arg !== "undefined")
            return arg;
    return null;
};

/**
 * Capitalizes the first letter of a string. It doesn't influence to case
 * of other letters.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} string - String to capitalize.
 * @return {string} Capitalized string.
 *
 * @example
 * U.capitalize('hello'); // 'Hello'
 * U.capitalize('Hello'); // 'Hello'
 * U.capitalize('hEllo'); // 'HEllo'
 */
const capitalize = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Creates each to each combinations of sets.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {Array<Array>} l - Array of arrays to combine.
 * @arg {?function} [p] - Function to process element before adding to combination.
 * It passes two arguments:
 * `e` - a new element to add;
 * `c` - assembling combination;
 * By default it just pushes `e` to `c`.
 * @return {Array<Array>} List of combinations.
 *
 * @example
 * each2each([[1, 2], [3, 4]]); // [[1, 3], [1, 4], [2, 3], [2, 4]]
 * each2each([[1, 2], [3, 4]], e => e + 1); // [[2, 4], [2, 5], [3, 4], [3, 5]]
 * each2each([[1, 2], [3, 4]], (e, c) => e + _.sum(c)); // [[1, 4], [1, 5], [2, 5], [2, 6]]
 */
const each2each = (l, p = e => e) => {
    let r = [[]];
    for (const i of l) {
        const t = [];
        for (const j of r) {
            for (const e of i) {
                const c = _.clone(j);
                c.push(p(e, c));
                t.push(c);
            }
        }
        r = t;
    }
    return r;
};

/**
 * Splits string to array by delimiter.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} s - String to split.
 * @arg {char} d - String delimiter.
 * @return {array<string>}
 *
 * @example
 * U.splitBy("a, b, c", ","); // ['a', 'b', 'c']
 */
const splitBy = (s, d) => _.filter(_.map(s.split(d), e => e.trim()));

/**
 * Checks if text contains words or no.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} string - Original text.
 * @arg {string} words - Checking words.
 * @return {boolean} - `true` if text contains words, `false` otherwise.
 *
 * @example
 * U.textContains("hello world", "hello world"); // true
 */
const textContains = (text, words) => {
    if (!text) return false;
    if (!words) return true;

    text = text.toLowerCase();
    words = words.toLowerCase().split(/ +/g);

    return _.isEmpty(missedWords(text, words, true));
};

/**
 * Detects words if they are missed in text (case-sensitive).
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} text - Text where words are looked for. 
 * @arg {string[]} words - Filtered words.
 * @arg {boolean} [firstMissedOnly=false] - Flag to return first missed word only.
 * It reduces searching time and recommended to use if not need to get all missed words.
 * @returns {string[]} - Array of missed words.
 *
 * @example
 * U.missedWords("hello world", ["hello", "man"]); // ["man"]
 */
const missedWords = (text, words, firstMissedOnly = false) => {

    if (!text || _.isEmpty(words)) {
        if (firstMissedOnly && !_.isEmpty(words)) {
            return words.slice(0, 1);
        } else {
            return words;
        }
    }

    const missed = [];
    for (const word of words) {
        if (text.includes(word)) continue;
        if (firstMissedOnly) return [word];
        missed.push(word);
    }
    return missed;
};

/**
 * Transforms string to kebab case. It replaces all symbols, except numbers,
 * chars and dots with dashes.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} str - String to transform.
 * @return {string} Transformed string.
 *
 * @example
 * U.toKebab("hello_world"); // "hello-world"
 */
const toKebab = str => {
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
 * Makes delay (sleep) during code execution.
 *
 * @memberOf module:glace-utils
 * @async
 * @function
 * @arg {number} timeout - Time to sleep, ms.
 * @arg {boolean} [blocking=false] - Flag whether sleep should be
 * block code execution.
 * @return {Promise<void>} If sleep isn't blocking.
 * @return {undefined} If sleep is blocking.
 *
 * @example
 * await U.sleep(1000); // async
 * U.sleep(1000, true); // sync
 */
const sleep = (timeout, blocking = false) => {
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
 * Waits for predicate returns truly value.
 *
 * @memberOf module:glace-utils
 * @async
 * @function
 * @arg {function} predicate - Function which should return truly value during
 * timeout.
 * @arg {object} [opts] - Options.
 * @arg {number} [opts.timeout=1] - Time to wait for predicate result, sec.
 * @arg {number} [opts.polling=0.1] - Time to poll predicate result, sec.
 * @return {Promise<object|boolean>} Predicate truly value or `false` if
 * predicate didn't return truly value during expected time.
 *
 * @example
 * await U.waitFor(() => 1, { timeout: 2 }); // 1
 */
const waitFor = async (predicate, opts) => {
    opts = coalesce(opts, {});
    const timeout = coalesce(opts.timeout, 1) * 1000;
    const polling = coalesce(opts.polling, 0.1) * 1000;
    const limit = new Date().getTime() + timeout;

    while(limit > new Date().getTime()) {
        const result = await predicate();
        if (result) return result;
        await sleep(polling);
    }

    return false;
};

/**
 * Waits during a time that predicate returns truly value.
 *
 * @memberOf module:glace-utils
 * @async
 * @function
 * @arg {function} predicate - Function which should return truly value during
 * timeout.
 * @arg {object} [opts] - Options.
 * @arg {number} [opts.timeout=1] - Time to wait predicate result, sec.
 * @arg {number} [opts.polling=0.1] - Time to poll predicate result, sec.
 * @return {Promise<object|boolean>} Predicate truly value or `false` if
 * predicate didn't return truly value during expected time.
 *
 * @example
 * await U.waitDuring(() => 5, { timeout: 0.5 }); // 5
 */
const waitDuring = async (predicate, opts) => {

    opts = coalesce(opts, {});
    const timeout = coalesce(opts.timeout, 1) * 1000;
    const polling = coalesce(opts.polling, 0.1) * 1000;
    const limit = new Date().getTime() + timeout;

    let result = null;
    while(limit > new Date().getTime()) {
        result = await predicate();
        if (!result) return false;
        await sleep(polling);
    }

    return result;
};

/**
 * `glacejs` fixtures factory. Provides easy way to make a fixture with hooks
 * related with shared context.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {object} [opts] - Options.
 * @arg {function} [opts.before] - Callback of `before` hook.
 * @arg {function} [opts.after] - Callback of `after` hook.
 * @arg {function} [opts.beforeChunk] - Callback of `beforeChunk` hook.
 * @arg {function} [opts.afterChunk] - Callback of `afterChunk` hook.
 * @return {function} - Fixture.
 */
const makeFixture = (opts = {}) => {
    return func => {
        const ctx = {};
        if (opts.before) before(opts.before(ctx));
        if (opts.beforeChunk) beforeChunk(opts.beforeChunk(ctx));
        func();
        if (opts.afterChunk) afterChunk(opts.afterChunk(ctx));
        if (opts.after) after(opts.after(ctx));
    };
};

/**
 * Activates docstring support for js functions.
 *
 * @memberOf module:glace-utils
 * @function
 */
const docString = () => {
    if (Object.prototype.hasOwnProperty.call(Function.prototype, "__doc__")) return;
    require("docstring");

    Function.prototype.bond = function (ctx) {
        const result = this.bind(ctx);
        Object.defineProperty(result, "__doc__", {
            value: this.__doc__,
            writable: false,
        });
        return result;
    };
};

/**
 * Defines whether object is located on screen or no.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {object} obj - Object which may be on screen.
 * @arg {object} screen - Screen object.
 * @arg {boolean} [fully=false] - Flag to check full presence on screen.
 * @return {boolean} `true` if it is on screen, `false` otherwise.
 */
const isInScreen = (obj, screen, fully = false) => {
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
 * @memberOf module:glace-utils
 * @function
 * @arg {object} obj - Object which should be on screen.
 * @arg {object} screen - Screen object.
 * @return {object} Object position on screen.
 * @throws {Error} If object isn't located on screen.
 */
const objOnScreenPos = (obj, screen) => {

    if (!isInScreen(obj, screen)) {
        throw new Error(
            `Object { x: ${obj.x}, y: ${obj.y}, width: ${obj.width}, ` +
            `height: ${obj.height} } isn't on screen { x: ${screen.x}, ` +
            `y: ${screen.y}, width: ${screen.width}, height: ${screen.height} }`);
    }

    const res = _.clone(obj);

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
 * Helper to kill processes by name.
 *
 * @memberOf module:glace-utils
 * @async
 * @function
 * @arg {string} procName - Process name or chunk of name.
 * @return {Promise<void>}
 */
const killProcs = procName => {
    logger.debug(`Looking for ${procName} processes to kill...`);

    return findProcess("name", procName).then(procList => {

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
 * Wraps function inside other functions.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {function[]} wrappers - List of functions which will wrap target.
 * @arg {function} target - Target function which will be wrapped.
 * @return {function} Wrapping function.
 */
const wrap = (wrappers, target) => {
    _.clone(wrappers).reverse().forEach(wrapper => {
        target = (target => () => wrapper(target))(target);
    });
    return target;
};

/**
 * Gets subfolders of directory.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} dir - Path to directory.
 * @arg {object} [opts] - Options.
 * @arg {boolean} [opts.nameOnly=false] - Gets only folder names. By default,
 *  full paths.
 * @return {string[]} Sequence of results.
 */
const subFolders = (dir, opts) => {
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
 * Exits process with error printing.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} source - Source of fatal error.
 * @return {function} Function with takes error to print and exits process.
 */
const exit = source => err => {
    console.log(source + ":", err);
    process.exit(1);
};

/**
 * Returns function which switches message color.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {object} [opts] - Options.
 * @arg {string} [opts.c1=magenta] - Color #1.
 * @arg {string} [opts.c2=cyan] - Color #2.
 * @return {function} Function to switch color of passed text in terminal.
 */
const switchColor = opts => {
    opts = opts || {};
    const c1 = opts.c1 || "magenta";
    const c2 = opts.c2 || "cyan";

    let trigger = true;
    return function () {
        let msg = Array.from(arguments).join(" ");
        msg = msg[trigger ? c1 : c2].bold;
        trigger = !trigger;
        return msg;
    };
};

/**
 * Helper to generate request key for storage.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {Request} req - Client request.
 * @return {string} Request key according to its method, host, url.
 */
const getReqKey = req => req.method + "_" + req.headers.host + req.url;

/**
 * Files sorted by order.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} dir - Path to directory.
 * @arg {boolean} [desc=false] - Flag to reverse order.
 * @return {string[]} Sequence of files sorted by order.
 */
const filesByOrder = (dir, desc = false) => {
    const filesList = fs
        .readdirSync(dir)
        .filter(filename => {
            const filePath = path.resolve(dir, filename);
            return !fs.statSync(filePath).isDirectory();
        })
        .map(filename => {
            return { path: path.resolve(dir, filename),
                number: parseInt(_.split(filename, "-", 1)[0]) || 0 };
        })
        .sort((a, b) => a.number - b.number)
        .map(el => el.path);

    if (desc) filesList.reverse();
    return filesList;
};

/**
 * Sorts files by date in folder.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} dir - Path to directory.
 * @arg {boolean} [desc=false] - Flag to reverse order.
 * @return {string[]} Sequence of files sorted by date
 */
const filesByDate = (dir, desc = false) => {
    const filesList = fs
        .readdirSync(dir)
        .filter(filename => {
            const filePath = path.resolve(dir, filename);
            return !fs.statSync(filePath).isDirectory();
        })
        .map(filename => {
            const filePath = path.resolve(dir, filename);
            return { path: filePath,
                time: fs.statSync(filePath).mtime.getTime() };
        })
        .sort((a, b) => a.time - b.time)
        .map(el => el.path);

    if (opts.desc) filesList.reverse();
    return filesList;
};

/**
 * Composes file path from segments. If folder of file is absent, it will
 * be created.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {...string} paths - A sequence of paths or path segments.
 * @return {string} Composed path.
 */
const mkpath = function () {
    var result = path.resolve.apply(path, arguments);
    var dirname = path.dirname(result);
    fse.mkdirsSync(dirname);
    return result;
};

/**
 * Clears empty folders recursive.
 *
 * @memberOf module:glace-utils
 * @function
 * @arg {string} folder - Path to root folder.
 */
const clearEmptyFolders = folder => {
    const files = fs.readdirSync(folder);

    for (const fileName of files) {
        const filePath = path.join(folder, fileName);
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

module.exports = {
    GlaceError,
    cwd,
    hostname,
    coalesce,
    capitalize,
    each2each,
    splitBy,
    textContains,
    missedWords,
    toKebab,
    sleep,
    waitFor,
    waitDuring,
    makeFixture,
    docString,
    isInScreen,
    objOnScreenPos,
    killProcs,
    wrap,
    subFolders,
    exit,
    switchColor,
    getReqKey,
    mkpath,
    filesByDate,
    filesByOrder,
    clearEmptyFolders,
};
