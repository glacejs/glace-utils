"use strict";

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
});
