"use strict";
/**
 * Gulp tasks.
 *
 * @module
 */

var gulp = require("gulp");
var clean = require("gulp-clean");
var spawn = require("cross-spawn");

gulp.task("mk-docs", () => {
    spawn.sync("jsdoc", [ "-c", "jsdoc.json", "-d", "docs" ]);
});

gulp.task("rm-docs", () => {
    gulp.src("docs", { read: false }).pipe(clean());
});

gulp.task("test", () => {
    spawn.sync("./node_modules/glace-core/bin/glace",
               [
                   "tests.js",
               ],
               { stdio: "inherit" });
});
