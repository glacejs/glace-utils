"use strict";

/**
 * Pool of Queues.
 *
 * @class
 * @arg {number} count - Number of queues.
 * @throws {AssertionError} - If queues count is not above 0.
 */

var LOG = require("./logger");

var gid = 0;

/**
 * Tasks queue.
 *
 * @class
 */
var Queue = function (id) {
    this.id = id || ++gid;
    this.weight = 0;
    this._p = Promise.resolve();
};

/**
 * Adds task to queue.
 *
 * @method
 * @arg {number} weight - Task weight.
 * @arg {function} task - Task.
 */
Queue.prototype.add = function (weight, task) {
    this.weight += weight;
    this._p = this._p
        .then(() => {
            LOG.silly(`Queue #${this.id}: task is started.`);
            return task();
        }).catch(e => LOG.error(e))
        .then(() => {
            this.weight -= weight;
            LOG.silly(`Queue #${this.id}: task is finished.`);
        });
};

var Pool = function (count) {
    count = count || 1;
    this._qq = [];
    for (var i = 0; i < count; i++) {
        this._qq.push(new Queue(i+1));
    };
};

/**
 * Addes task to the least loaded queue.
 *
 * @method
 * @arg {number} weight - Task weight.
 * @arg {function} task - Task.
 */
Pool.prototype.add = function (weight, task) {

    if (typeof(weight) === "function") {
        task = weight;
        weight = 1;
    }

    var queue = this._qq[0];
    for (var q of this._qq) {
        if (queue.weight === 0) break;
        if (q.weight < queue.weight) queue = q;
    };
    queue.add(weight, task);
};

module.exports = Pool;
