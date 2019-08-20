"use strict";

/**
 * GlaceJS config.
 *
 * @ignore
 * @module
 */

var fs = require("fs");
var path = require("path");

var _ = require("lodash");
var argv = require("yargs").argv;

var loadJson = require("./loadJson");

var config;
if (global.__glaceConfig) {
    config = global.__glaceConfig;
} else {
    /**
    * @prop {object} config - `GlaceJS` config.
    */
    config = global.__glaceConfig = {};

    var argsConfig = {};
    var argsConfigPath = path.resolve(process.cwd(), (argv.c || argv.config || "config.json"));

    if (fs.existsSync(argsConfigPath)) {
        argsConfig = loadJson(argsConfigPath);

        for (var key in argsConfig) {
            var val = argsConfig[key];
            argsConfig[_.camelCase(key)] = val;
        }
    }
    _.mergeWith(argsConfig, argv, (objVal, srcVal) => srcVal ? srcVal : objVal);
    config.args = argsConfig;
}

module.exports = config;
