"use strict";

test("internal logger", () => {

    var pKill, U;

    before(() => {
        pKill = process.kill;
        global.__glaceLogger = { debug: sinon.spy() };
        process.kill = sinon.spy();
        U = require(".");
        U.__findProcess = () => Promise.resolve([{ pid: 1 }]);
    });

    after(() => {
        process.kill = pKill;
    });

    chunk("is defined if global logger is already created", async () => {
        await U.killProcs("test");
        expect(__glaceLogger.debug.calledOnce).to.be.true;
    });
});
