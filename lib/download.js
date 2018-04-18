"use strict";

/**
 * Downloads files.
 *
 * @memberOf module:index
 * @function download
 * @arg {string[]} urls - List of URLs to download.
 * @arg {object} opts - Options.
 * @arg {string} [opts.dir] - Folder to download. Omitted if `paths` is specified.
 * @arg {string[]} [opts.paths] - List of paths to download. Corresponds to list of `urls`.
 * @arg {number} [opts.attempts=1] - Number of attempts to download.
 * @arg {number} [opts.threads=1] - Number of threads to download.
 * @arg {number} [opts.polling=100] - Number of ms to check downloading state.
 */

var fs = require("fs");
var https = require("https");
var path = require("path");
var url = require("url");

var _ = require("lodash");

var LOG = require("./logger");
var Pool = require("./pool");

var downloadFile = (fileUrl, filePath) => {

    LOG.silly(`Downloading '${fileUrl}' to '${filePath}' ...`);

    return new Promise((resolve, reject) => {

        https.get(fileUrl, response => {

            if (response.statusCode !== 200) {
                LOG.silly(`Failed to download '${fileUrl}' to '${filePath}'`);
                reject(new Error(`Response ${response.statusCode} - ${response.statusMessage}`));
                return;
            }

            var file = fs.createWriteStream(filePath);

            response.pipe(file);
            file.on("finish", () => {
                LOG.silly(`Downloaded '${fileUrl}' to '${filePath}'`);
                file.close(resolve);
            });

        }).on("error", err => {

            LOG.silly(`Failed to download '${fileUrl}' to '${filePath}'`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            reject(err);
        });
    });
};

var rmEl = (el, arr) => {
    arr.splice(arr.indexOf(el), 1);
};

var downloadAttempt = (pool, _url, _path, urls, passed, failed, attempts) => () => {
    return downloadFile(_url, _path).then(() => {

        rmEl(_url, urls);
        passed[_url] = _path;

    }).catch(() => {

        failed[_url] = (failed[_url] || 0) + 1;
        rmEl(_url, urls);

        if (failed[_url] < attempts) {
            LOG.silly(`Retry to download '${_url}' to '${_path}'`);
            urls.push(_url);
            pool.add(downloadAttempt(pool, _url, _path, urls, passed, failed, attempts));
        };
    });
};

var download = async (urls, opts) => {
    opts = opts || {};
    var dir = opts.dir;
    var paths = opts.paths;

    if (!dir && !paths) {
        throw new Error("Option 'dir' or 'paths' should be provided");
    }

    if (paths && paths.length !== urls.length) {
        throw new Error(`Length of 'paths' should be ${urls.length}`);
    }

    var attempts = opts.attempts || 1;
    var threads = opts.threads || 1;
    var polling = opts.polling || 100;

    var pool = new Pool(threads);
    var passed = {}, failed = {};

    urls = _.clone(urls);
    for (var i = 0; i < urls.length; i++) {
        var _url = urls[i];
        if (paths) {
            var _path = paths[i];
        } else {
            _path = path.resolve(dir, path.posix.basename(url.parse(_url).pathname));
        }
        pool.add(downloadAttempt(pool, _url, _path, urls, passed, failed, attempts));
    };

    await new Promise(resolve => {
        var timerId = setInterval(() => {
            if (urls.length) return;
            clearInterval(timerId);
            resolve();
        }, polling);
    });

    var notDownloaded = [];
    for (var [key, val] of Object.entries(failed)) {
        if (val < attempts) continue;
        notDownloaded.push(key);
    };

    return {
        downloaded: passed,
        failed: notDownloaded,
    };
};

module.exports = download;
