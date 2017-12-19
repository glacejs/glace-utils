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
        var jPath1 = temp.path({ suffix: ".json" });

        var json2 = '{ "a": 2, "b": 2, "__parent": "' + jPath1 + '" }';
        var jPath2 = temp.path({ suffix: ".json" });

        var json3 = '{ "a": 3, "__parent": "' + jPath2 + '" }';
        var jPath3 = temp.path({ suffix: ".json" });

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
        var jPath1 = temp.path({ suffix: ".json" });

        var json2 = '{ "a": 2, "b": 2, "__parent": "' + jPath1 + '" }';
        var jPath2 = temp.path({ suffix: ".json" });

        fs.writeFileSync(jPath1, json1);
        fs.writeFileSync(jPath2, json2);

        expect(() => U.loadJson(jPath2)).to.throw(jPath1);
    });

    chunk("throws error if circular parent reference detected", () => {
        var jPath1 = temp.path({ suffix: ".json" });
        var jPath2 = temp.path({ suffix: ".json" });

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
