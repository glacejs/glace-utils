"use strict";

const format = require("util").format;

const modulePath = "../../lib/small";
const small = rehire(modulePath, {
    os: {
        hostname: () => "MY_HOST",
    },
});

suite("small", () => {

    test("GlaceError", () => {
        let GlaceError = small.GlaceError;

        chunk("can be thrown with message", () => {
            expect(() => {
                throw new GlaceError("glace error");
            }).to.throw("glace error");
        });
    });

    test("hostname", () => {

        chunk("is in low case", () => {
            expect(small.hostname).to.be.equal("my_host");
        });
    });

    test("coalesce", () => {

        chunk("returns defined default value", () => {
            expect(small.coalesce()).to.be.null;
            expect(small.coalesce(undefined)).to.be.null;
            expect(small.coalesce(undefined, 1, 2)).to.be.equal(1);
            expect(small.coalesce(null, 1)).to.be.null;
        });
    });

    test("capitalize", () => {
        [
            ["hello", "Hello"],
            ["hEllo", "HEllo"],
            ["Hello", "Hello"],
        ].forEach(([actual, expected]) => {
            chunk(`${actual} -> ${expected}`, () => {
                expect(small.capitalize(actual)).to.be.equal(expected)
            });
        });
    });

    test("each2each", () => {

        chunk("combines sets", () => {
            expect(small.each2each([[1, 2], [3, 4]]))
                .to.be.eql([[1, 3], [1, 4], [2, 3], [2, 4]]);
        });

        chunk("combines sets with custom processing", () => {
            expect(small.each2each([[1, 2], [3, 4]], e => e + 1))
                .to.be.eql([[2, 4], [2, 5], [3, 4], [3, 5]]);
        });
    });

    test("splitBy", () => {
        [
            ["a, b, c,", ",", ["a", "b", "c"]],
            ["a | b | c,", "|", ["a", "b", "c,"]],
        ].forEach(([actual, delimiter, expected]) => {
            chunk(`${actual} -> ${expected}`, () => {
                expect(small.splitBy(actual, delimiter)).to.be.eql(expected)
            });
        });
    });

    test("textContains", () => {
        [
            ["hello world", "hello world", true],
            ["hello world", " hello  world ", true],
            ["HELLO world", "hello WORLD", true],
            ["hello world", "", true],
            ["hello world", "bad world", false],
            ["", "hello world", false],
        ].forEach(([text, words, bool]) => {
            chunk(`"${words}" in "${text}" -> ${bool}`, () => {
                expect(small.textContains(text, words)).to.be.equal(bool);
            });
        });
    });

    test("missedWords", () => {

        chunk("returns empty array of missed words", () => {
            expect(small.missedWords("hello world", ["hello", "world"]))
                .to.be.empty;
            
            expect(small.missedWords("hello world", [])).to.be.empty;
            expect(small.missedWords("", [])).to.be.empty;
        });

        chunk("returns array of all missed words", () => {
            expect(small.missedWords("hello world", ["helo", "word"]))
                .to.be.eql(["helo", "word"]);

            expect(small.missedWords("", ["helo", "word"]))
                .to.be.eql(["helo", "word"]);
        });

        chunk("returns array with first missed word", () => {
            expect(small.missedWords("hello world", ["helo", "word"], true))
                .to.be.eql(["helo"]);

            expect(small.missedWords("", ["helo", "word"], true))
                .to.be.eql(["helo"]);
        });
    });

    test("toKebab", () => {
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
                expect(small.toKebab(str)).to.be.equal(res);
            });
        });
    });

    test("sleep", () => {
        let now;

        beforeChunk(() => {
            now = new Date().getTime();
        });

        chunk("asynchronous", async () => {
            await small.sleep(100);
            expect(new Date().getTime() - now).to.be.gte(100);
        });

        chunk("synchronous", () => {
            small.sleep(100, true);
            expect(new Date().getTime() - now).to.be.gte(100);
        });
    });

    test("waitFor", () => {
        let now;
    
        beforeChunk(() => {
            now = new Date().getTime();
        });
    
        chunk("works with default options", async () => {
            expect(await small.waitFor(() => true)).to.be.true;
            expect(new Date().getTime() - now).to.below(1000);
        });
    
        chunk("returns predicate result if success", async () => {
            let i = 0;
            const predicate = () => {
                if (i === 5) return 5;
                i++;
            };
    
            expect(await small.waitFor(predicate, { timeout: 2 })).to.be.equal(5);
            expect(new Date().getTime() - now).to.be.gte(500).and.below(2000);
        });
    
        chunk("returns false if didn't wait for timeout", async () => {
            expect(await small.waitFor(() => false, { timeout: 2 })).to.be.false;
            expect(new Date().getTime() - now).to.be.gte(2000);
        });
    
        chunk("throws the same error as predicate", async () => {
            const predicate = () => {
                throw new Error("BOOM!");
            };
            await expect(small.waitFor(predicate)).to.be.rejectedWith("BOOM!");
        });
    });

    test("waitDuring", () => {
        let now;
    
        beforeChunk(() => {
            now = new Date().getTime();
        });
    
        chunk("works with default options", async () => {
            expect(await small.waitDuring(() => true)).to.be.true;
            expect(new Date().getTime() - now).to.be.gte(1000);
        });
    
        chunk("returns predicate result if success", async () => {
            expect(await small.waitDuring(() => 5, { timeout: 0.5 })).to.be.equal(5);
            expect(new Date().getTime() - now).to.be.gte(500);
        });
    
        chunk("returns false if didn't wait for timeout", async () => {
            expect(await small.waitDuring(() => false)).to.be.false;
            expect(new Date().getTime() - now).to.be.below(1000);
        });
    
        chunk("throws the same error as predicate", async () => {
            const predicate = () => {
                throw new Error("BOOM!");
            };
            await expect(small.waitDuring(predicate)).to.be.rejectedWith("BOOM!");
        });
    });

    test("makeFixture", () => {
        let fixture, before_, after_, beforeChunk_, afterChunk_;

        beforeChunk(() => {
            before_ = sinon.stub();
            after_ = sinon.stub();
            beforeChunk_ = sinon.stub();
            afterChunk_ = sinon.stub();

            small.__set__("before", before_);
            small.__set__("after", after_);
            small.__set__("beforeChunk", beforeChunk_);
            small.__set__("afterChunk", afterChunk_);
        });

        chunk("without hooks", () => {
            fixture = small.makeFixture();
            const cb = sinon.stub();
            fixture(cb);
            expect(cb).to.be.calledOnce;
            expect(before_).to.not.be.called;
            expect(after_).to.not.be.called;
            expect(beforeChunk_).to.not.be.called;
            expect(afterChunk_).to.not.be.called;
        });

        chunk("with all hooks", () => {
            const beforeCb = sinon.stub();
            const afterCb = sinon.stub();
            const beforeChunkCb = sinon.stub();
            const afterChunkCb = sinon.stub();

            fixture = small.makeFixture({
                before: beforeCb,
                after: afterCb,
                beforeChunk: beforeChunkCb,
                afterChunk: afterChunkCb,
            });

            const cb = sinon.stub();
            fixture(cb);
            expect(cb).to.be.calledOnce;

            expect(before_).to.be.calledOnce;
            expect(after_).to.be.calledOnce;
            expect(beforeChunk_).to.be.calledOnce;
            expect(afterChunk_).to.be.calledOnce;

            expect(beforeCb).to.be.calledOnce;
            expect(afterCb).to.be.calledOnce;
            expect(beforeChunkCb).to.be.calledOnce;
            expect(afterChunkCb).to.be.calledOnce;

            expect(beforeCb.args[0][0]).to.be.eql({});
            expect(afterCb.args[0][0]).to.be.eql({});
            expect(beforeChunkCb.args[0][0]).to.be.eql({});
            expect(afterChunkCb.args[0][0]).to.be.eql({});

            expect(beforeChunk_).to.be.calledAfter(before_);
            expect(cb).to.be.calledAfter(beforeChunk_);
            expect(afterChunk_).to.be.calledAfter(cb);
            expect(after_).to.be.calledAfter(afterChunk_);
        });

        chunk("with 'before' hook", () => {
            fixture = small.makeFixture({ before: () => {} });
            const cb = sinon.stub();
            fixture(cb);
            expect(cb).to.be.calledOnce;

            expect(before_).to.be.calledOnce;
            expect(after_).to.not.be.called;
            expect(beforeChunk_).to.not.be.called;
            expect(afterChunk_).to.not.be.called;
        });

        chunk("with 'after' hook", () => {
            fixture = small.makeFixture({ after: () => {} });
            const cb = sinon.stub();
            fixture(cb);
            expect(cb).to.be.calledOnce;

            expect(before_).to.not.be.called;
            expect(after_).to.be.calledOnce;
            expect(beforeChunk_).to.not.be.called;
            expect(afterChunk_).to.not.be.called;
        });

        chunk("with 'beforeChunk' hook", () => {
            fixture = small.makeFixture({ beforeChunk: () => {} });
            const cb = sinon.stub();
            fixture(cb);
            expect(cb).to.be.calledOnce;

            expect(before_).to.not.be.called;
            expect(after_).to.not.be.called;
            expect(beforeChunk_).to.be.calledOnce;
            expect(afterChunk_).to.not.be.called;
        });

        chunk("with 'afterChunk' hook", () => {
            fixture = small.makeFixture({ afterChunk: () => {} });
            const cb = sinon.stub();
            fixture(cb);
            expect(cb).to.be.calledOnce;

            expect(before_).to.not.be.called;
            expect(after_).to.not.be.called;
            expect(beforeChunk_).to.not.be.called;
            expect(afterChunk_).to.be.calledOnce;
        });
    });
    
    test("isInScene", () => {
    
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
                    expect(small.isInScreen(obj, screen)).to.be.equal(result);
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
                    expect(small.isInScreen(obj, screen, true)).to.be.equal(result);
                });
            });
        });
    });

    test("objOnScreenPos", () => {
    
        chunk("throws error if object isn't on screen", () => {
            expect(() => small.objOnScreenPos(
                { x: 5, y: 0, width: 1, height: 1 },
                { x: 0, y: 0, width: 1, height: 1 }
            )).to.throw("isn't on screen");
        });
    
        chunk("returns the same if object is fully on screen", () => {
            expect(small.objOnScreenPos(
                { x: 1, y: 2, width: 3, height: 4 },
                { x: 0, y: 0, width: 10, height: 10 }
            )).to.include({ x: 1, y: 2, width: 3, height: 4 });
        });
    
        chunk("returns restricted part if object oversizes screen", () => {
            expect(small.objOnScreenPos(
                { x: 0, y: 0, width: 10, height: 10 },
                { x: 1, y: 2, width: 3, height: 4 }
            )).to.include({ x: 1, y: 2, width: 3, height: 4 });
        });
    });

    test("docString", () => {
        let x, y;
    
        beforeChunk(() => {
            small.docString();
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
            let z = x.bond({});
            expect(z.name).to.be.equal("bound x");
            expect(z.__doc__).to.be.equal(" docstring ");
            z = y.bond({});
            expect(z.name).to.be.equal("bound y");
            expect(z.__doc__).to.be.equal("");
        });
    });
});
