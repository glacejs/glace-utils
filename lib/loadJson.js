"use strict";

/**
 * Loads json file which may have comments.
 *
 * If json file has key `__parent` with path to parent json
 * it will be loaded and merged recursively.
 *
 * @function loadJson
 * @arg {string} name - Name of JSON file.
 * @return {object} - Object.
 * @throws {Error} If JSON file isn't parsable.
 * @throws {Error} If there is circular parent reference.
 */

var fs = require("fs");
var path = require("path");

var _ = require("lodash");
var json = require("comment-json");

module.exports = name => {
    var alreadyLoaded = [];
    var cwd = process.cwd();

    var load = name => {
        if (!name.endsWith(".json")) name += ".json";
        var jsonPath = path.resolve(cwd, name);

        if (alreadyLoaded.includes(jsonPath)) {
            throw new Error(
                `Circular reference detected, '${jsonPath}' is loaded already`);
        }
        alreadyLoaded.push(jsonPath);

        try {
            var result = json.parse(
                fs.readFileSync(jsonPath).toString(), null, true);
        } catch (e) {
            throw new Error(`Can't parse ${jsonPath}. ${e}`);
        }

        if (result.__parent) {
            var parent = load(result.__parent);
            result = _.merge(parent, result);
        }

        delete result.__parent;
        return result;
    };

    return load(name);
};
