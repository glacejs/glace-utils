"use strict";

var fs = require("fs");

var _ = require("lodash");
var temp = require("temp").track();

var U = rehire(".");

suite("Utils", () => {
    var sandbox = sinon.createSandbox();

    afterChunk(() => {
        sandbox.restore();
    });

    test("internal logger", () => {

        var pKill, U;
    
        beforeChunk(() => {
            pKill = process.kill;
    
            delete require.cache[require.resolve(".")];
            sandbox.stub(global.__glaceLogger, "debug");
            process.kill = sinon.spy();
            U = require(".");
            U.__findProcess = () => Promise.resolve([{ pid: 1 }]);
        });
    
        afterChunk(() => {
            process.kill = pKill;
        });
    
        chunk("is defined if global logger is already created", async () => {
            await U.killProcs("test");
            expect(global.__glaceLogger.debug).to.be.calledThrice;
        });
    });
    
    test(".loadJson()", () => {
    
        chunk("loads plain json file", () => {
            var json = "{ \"a\": 1 }";
            var jPath = temp.path({ suffix: ".json" });
    
            fs.writeFileSync(jPath, json);
    
            expect(U.loadJson(jPath).a).to.be.equal(1);
        });
    
        chunk("loads json with comments", () => {
            var json = " \
                {\n \
                    // \"b\": 2,\n \
                    \"a\": 1\n \
                } \
            ";
            var jPath = temp.path({ suffix: ".json" });
    
            fs.writeFileSync(jPath, json);
            var res = U.loadJson(jPath);
    
            expect(res.a).to.be.equal(1);
            expect(res.b).to.be.undefined;
        });
    
        chunk("loads json parents", () => {
            var json1 = "{ \"a\": 1, \"b\": 1, \"c\": 1 }";
            var jPath1 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");
    
            var json2 = "{ \"a\": 2, \"b\": 2, \"__parent\": \"" + jPath1 + "\" }";
            var jPath2 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");
    
            var json3 = "{ \"a\": 3, \"__parent\": \"" + jPath2 + "\" }";
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
            var json = "{ \"a\": 1, }";
            var jPath = temp.path({ suffix: ".json" });
    
            fs.writeFileSync(jPath, json);
    
            expect(() => U.loadJson(jPath)).to.throw(jPath);
        });
    
        chunk("throws error if json parent isn't parsable", () => {
            var json1 = "{ \"a\": 1, \"b\": 1, \"c\": 1, }";
            var jPath1 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");
    
            var json2 = "{ \"a\": 2, \"b\": 2, \"__parent\": \"" + jPath1 + "\" }";
            var jPath2 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");
    
            fs.writeFileSync(jPath1, json1);
            fs.writeFileSync(jPath2, json2);
    
            expect(() => U.loadJson(jPath2)).to.throw(jPath1.replace(/\\\\/g, "\\"));
        });
    
        chunk("throws error if circular parent reference detected", () => {
            var jPath1 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");
            var jPath2 = temp.path({ suffix: ".json" }).replace(/\\/g, "\\\\");
    
            var json1 = "{ \"__parent\": \"" + jPath2 + "\" }";
            var json2 = "{ \"__parent\": \"" + jPath1 + "\" }";
    
            fs.writeFileSync(jPath1, json1);
            fs.writeFileSync(jPath2, json2);
    
            expect(() => U.loadJson(jPath1)).to.throw("Circular reference");
            expect(() => U.loadJson(jPath2)).to.throw("Circular reference");
        });
    });

    test(".textContains()", () => {
    
        chunk("returns false if no text", () => {
            expect(U.textContains(null, null)).to.be.false;
        });
    
        chunk("returns true if no words", () => {
            expect(U.textContains("hello world", null)).to.be.true;
        });
    
        chunk("returns false if doesn't contain any word", () => {
            expect(U.textContains("hello world", "hello man")).to.be.false;
        });
    
        chunk("returns true if contains all words", () => {
            expect(U.textContains("Nice weather, man!", "weather Man")).to.be.true;
        });
    });

    test(".each2each()", () => {
        chunk("with default options", () => {
            expect(U.each2each([[1, 2], [3, 4]]))
                .to.be.eql([[1, 3], [1, 4], [2, 3], [2, 4]]);
        });

        chunk("with custom addition", () => {
            expect(U.each2each([[1, 2], [3, 4]], (e, c) => e + _.sum(c)))
                .to.be.eql([[1, 4], [1, 5], [2, 5], [2, 6]]);
        });
    });

    test(".splitBy()", () => {
        chunk("splits by comma", () => {
            expect(U.splitBy("a, b, c,", ",")).to.be.eql(["a", "b", "c"]);
        });

        chunk("splits by pipe", () => {
            expect(U.splitBy("a | b | c", "|")).to.be.eql(["a", "b", "c"]);
        });

        chunk("gets empty array", () => {
            expect(U.splitBy("", ",")).to.be.empty;
        });
    });
});
