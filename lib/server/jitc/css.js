define(['underscore', 'async'], function (_, async) {

    'use strict';

    var crypto = require('crypto'),
        fs = require('fs'),
        path = require('path'),
        cleanCss = require('clean-css');

    function createUrls(files, options) { // replace fully qualified path with url for browser
        var prefix = options.prefix ? path.normalize(options.prefix + '/') : '',
            basePath = options.basePath;

        return _.map(files, function (file) {
            return path.normalize(prefix + file.replace(basePath, ''));
        });
    }

    return {

        bundle: function (options, callback) {
            var md5 = crypto.createHash('md5'),
                minifiedFileName = (options.outFileName ? options.outFileName : md5.update(options.files.join(''), 'utf8').digest('hex')) + '.css',
                outPath = path.normalize(options.basePath + '/' + options.outDir),
                minifiedFilePath = path.normalize(outPath + '/' + minifiedFileName),
                tasks = [];

            function resolvePath(file) {
                return path.normalize(options.basePath + '/' + file);
            }

            fs.exists(minifiedFilePath, function (exists) {
                var files;

                if (exists && !options.overwrite) {
                    return callback(null, createUrls([minifiedFilePath], options));
                } else {
                    files = options.files;
                    for (var i = 0; i < files.length; i++) {
                        (function (i) {
                            tasks.push(function (callback) {
                                var filePath = resolvePath(files[i]),
                                    retVal = {};

                                fs.readFile(filePath, 'utf8', function (err, css) {
                                    if (err) {
                                        return callback(err);
                                    }

                                    retVal[filePath] = css;
                                    callback(null, [filePath, css]);
                                });
                            });
                        })(i);
                    }

                    async.parallel(tasks, function (err, css) {
                        var cssStr,
                            urlRegex = /(?:\@import)?\s*url\(\s*(['"]?)(\S+)\1\s*\)/g;

                        if (err) {
                            return callback(err);
                        }

                        // set image urls to absolute paths
                        for (var i = 0; i < css.length; i++) {
                            css[i][1] = css[i][1].replace(urlRegex, function (match, quote, img, offset, str) {
                                var absoluteUrl;

                                if (img.substr(0, 1) === '/') { // already using absolute path
                                    return str;
                                }

                                absoluteUrl = path.resolve(path.dirname(css[i][0]), img).replace(options.basePath, '');
                                return match.replace(img, absoluteUrl);
                            });
                        }

                        cssStr = cleanCss.process(css.map(function (def) {
                            return def[1];
                        }).join(' '));
                        fs.exists(outPath, function (exists) {
                            if (exists) {
                                fs.writeFile(minifiedFilePath, cssStr, 'utf8', function (err) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    callback(null, createUrls([minifiedFilePath], options));
                                });
                            } else {
                                fs.mkdir(outPath, function () {
                                    fs.writeFile(minifiedFilePath, cssStr, 'utf8', function (err) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        callback(null, createUrls([minifiedFilePath], options));
                                    });
                                });
                            }
                        });
                    });
                }
            });
        }

    };

});