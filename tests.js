"use strict";

var fs = require("fs");

var temp = require("temp").track();

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
    var U;

    before(() => {
        U = require(".");
    });

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
