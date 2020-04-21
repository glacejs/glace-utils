

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
