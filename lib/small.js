/**
 * Functions & classes, which content is trivial or|and doesn't require
 * complex implementation (<10 SLOC mostly).
 *
 * @module
 */

const os = require("os");
const util = require("util");

const _ = require("lodash");
const BaseError = require("es6-error");

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

module.exports = {
    GlaceError,
    hostname,
    coalesce,
    capitalize,
    each2each,
    splitBy,
    textContains,
    missedWords,
};
