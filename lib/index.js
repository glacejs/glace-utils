/**
 * `GlaceJS` utils.
 *
 * @module glace-utils
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const util = require("util");

const colors = require("colors");
const espree = require("espree");
const highlight = require("cli-highlight").highlight;
const _ = require("lodash");
const yargs = require("yargs").help(" ");  // disable default `--help` capture
const fse = require("fs-extra");

Object.assign(exports, require("./small"));
exports.help = require("./help");
exports.debug = require("./debug");
exports.download = require("./download");
exports.Pool = require("./pool");
exports.loadJson = require("./loadJson");
exports.config = require("./config");
exports.logger = require("./logger");
