"use strict";

var fs = require("fs");
var format = require("util").format;

var temp = require("temp").track();

var U = require(".");

test("internal logger", () => {

    var pKill, U, LOG;

    before(() => {
        pKill = process.kill;
        LOG = global.__glaceLogger;

        delete require.cache[require.resolve(".")];
        global.__glaceLogger = { debug: sinon.spy() };
        process.kill = sinon.spy();
        U = require(".");
        U.__findProcess = () => Promise.resolve([{ pid: 1 }]);
    });

    after(() => {
        global.__glaceLogger = LOG;
        process.kill = pKill;
    });

    chunk("is defined if global logger is already created", async () => {
        await U.killProcs("test");
        expect(__glaceLogger.debug.calledOnce).to.be.true;
    });
});

test(".loadJson()", () => {

    chunk("loads plain json file", () => {
        var json = '{ "a": 1 }';
        var jPath = temp.path({ suffix: ".json" });

        fs.writeFileSync(jPath, json);

        expect(U.loadJson(jPath).a).to.be.equal(1);
    });

    chunk("loads json with comments", () => {
        var json = ' \
            {\n \
                // "b": 2,\n \
                "a": 1\n \
            } \
        ';
        var jPath = temp.path({ suffix: ".json" });

        fs.writeFileSync(jPath, json);
        var res = U.loadJson(jPath);

        expect(res.a).to.be.equal(1);
        expect(res.b).to.be.undefined;
    });

    chunk("loads json parents", () => {
        var json1 = '{ "a": 1, "b": 1, "c": 1 }';
        var jPath1 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");

        var json2 = '{ "a": 2, "b": 2, "__parent": "' + jPath1 + '" }';
        var jPath2 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");

        var json3 = '{ "a": 3, "__parent": "' + jPath2 + '" }';
        var jPath3 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");

        fs.writeFileSync(jPath1, json1);
        fs.writeFileSync(jPath2, json2);
        fs.writeFileSync(jPath3, json3);

        var res = U.loadJson(jPath3);

        expect(res.a).to.be.equal(3);
        expect(res.b).to.be.equal(2);
        expect(res.c).to.be.equal(1);
        expect(res.__parent).to.be.undefined;
    });

    chunk("throws error if json isn't parsable", () => {
        var json = '{ "a": 1, }';
        var jPath = temp.path({ suffix: ".json" });

        fs.writeFileSync(jPath, json);

        expect(() => U.loadJson(jPath)).to.throw(jPath);
    });

    chunk("throws error if json parent isn't parsable", () => {
        var json1 = '{ "a": 1, "b": 1, "c": 1, }';
        var jPath1 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");

        var json2 = '{ "a": 2, "b": 2, "__parent": "' + jPath1 + '" }';
        var jPath2 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");

        fs.writeFileSync(jPath1, json1);
        fs.writeFileSync(jPath2, json2);

        expect(() => U.loadJson(jPath2)).to.throw(jPath1.replace(/\\\\/g, "\\"));
    });

    chunk("throws error if circular parent reference detected", () => {
        var jPath1 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");
        var jPath2 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");

        var json1 = '{ "__parent": "' + jPath2 + '" }';
        var json2 = '{ "__parent": "' + jPath1 + '" }';

        fs.writeFileSync(jPath1, json1);
        fs.writeFileSync(jPath2, json2);

        expect(() => U.loadJson(jPath1)).to.throw("Circular reference");
        expect(() => U.loadJson(jPath2)).to.throw("Circular reference");
    });
});

test(".isInScene()", () => {

    scope("partially", () => {
        [
            [{x: 0, y: 0, width: 1, height: 1}, {x: 0, y: 0, width: 1, height: 1}, true],
            [{x: -1, y: -1, width: 3, height: 3}, {x: 0, y: 0, width: 1, height: 1}, true],
            [{x: 1, y: 1, width: 2, height: 2}, {x: 0, y: 0, width: 3, height: 3}, true],
            [{x: 1, y: 0, width: 1, height: 1}, {x: 0, y: 0, width: 1, height: 1}, false],
            [{x: 0, y: 1, width: 1, height: 1}, {x: 0, y: 0, width: 1, height: 1}, false],
            [{x: -1, y: 0, width: 1, height: 1}, {x: 0, y: 0, width: 1, height: 1}, false],
            [{x: 1, y: -1, width: 1, height: 1}, {x: 0, y: 0, width: 1, height: 1}, false],
        ].forEach(([obj, screen, result]) => {
            chunk(format(obj, "in", screen, "is", result), () => {
                expect(U.isInScreen(obj, screen)).to.be.equal(result);
            });
        });
    });

    scope("fully", () => {
        [
            [{x: 0, y: 0, width: 1, height: 1}, {x: 0, y: 0, width: 1, height: 1}, true],
            [{x: 1, y: 1, width: 2, height: 2}, {x: 0, y: 0, width: 3, height: 3}, true],
            [{x: -1, y: -1, width: 3, height: 3}, {x: 0, y: 0, width: 1, height: 1}, false],
        ].forEach(([obj, screen, result]) => {
            chunk(format(obj, "in", screen, "is", result), () => {
                expect(U.isInScreen(obj, screen, { fully: true })).to.be.equal(result);
            });
        });
    });
});

test(".toKebab()", () => {
    [
        ["", ""],
        ["a", "a"],
        [" ", ""],
        [" a ", "a"],
        [" !#@$!@#$ a @#@#$ ", "a"],
        ["a @#$@#$ a", "a-a"],
        ["a #.a", "a.a"],
        ["a #_a", "a_a"],
        ["a@^", "a"],
        ["$@a", "a"],
        ["a1", "a1"],
        ["1a", "1a"],
    ].forEach(([str, res]) => {
        chunk(`'${str}' -> '${res}'`, () => {
            expect(U.toKebab(str)).to.be.equal(res);
        });
    });
});

test(".objOnScreenPos()", () => {

    chunk("throws error if object isn't on screen", () => {
        expect(() => U.objOnScreenPos(
            { x: 5, y: 0, width: 1, height: 1 },
            { x: 0, y: 0, width: 1, height: 1 }
        )).to.throw("isn't on screen");
    });

    chunk("returns the same if object is fully on screen", () => {
        expect(U.objOnScreenPos(
            { x: 1, y: 2, width: 3, height: 4 },
            { x: 0, y: 0, width: 10, height: 10 }
        )).to.include({ x: 1, y: 2, width: 3, height: 4 });
    });

    chunk("returns restricted part if object oversizes screen", () => {
        expect(U.objOnScreenPos(
            { x: 0, y: 0, width: 10, height: 10 },
            { x: 1, y: 2, width: 3, height: 4 }
        )).to.include({ x: 1, y: 2, width: 3, height: 4 });
    });
});

test(".waitFor()", () => {
    var now;

    beforeChunk(() => {
        now = new Date().getTime();
    });

    chunk("works with default options", async () => {
        expect(await U.waitFor(() => true)).to.be.true;
        expect(new Date().getTime() - now).to.below(1000);
    });

    chunk("returns predicate result if success", async () => {
        var i = 0;
        var predicate = () => {
            if (i === 5) return 5;
            i++;
        };

        expect(await U.waitFor(predicate, { timeout: 2 })).to.be.equal(5);
        expect(new Date().getTime() - now).to.be.gte(500).and.below(2000);
    });

    chunk("returns false if didn't wait for timeout", async () => {
        expect(await U.waitFor(() => false, { timeout: 2 })).to.be.false;
        expect(new Date().getTime() - now).to.be.gte(2000);
    });

    chunk("throws the same error as predicate", async () => {
        var predicate = () => {
            throw new Error("BOOM!");
        };
        await expect(U.waitFor(predicate)).to.be.rejectedWith("BOOM!");
    });
});

test(".docString()", () => {
    var x, y;

    beforeChunk(() => {
        U.docString();
        x = function () {
            /** docstring */
            return 1;
        };
        y = function () {};
    });

    chunk("creates property __doc__", () => {
        expect(x.__doc__).to.be.equal(" docstring ");
        expect(y.__doc__).to.be.equal("");
    });

    chunk("creates function bond", () => {
        var z = x.bond({});
        expect(z.name).to.be.equal("bound x");
        expect(z.__doc__).to.be.equal(" docstring ");
        z = y.bond({});
        expect(z.name).to.be.equal("bound y");
        expect(z.__doc__).to.be.equal("");
    });
});
