"use strict";

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
