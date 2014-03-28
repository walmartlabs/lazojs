define(function () {

    'use strict';

    // parent module is only loaded on the server
    var fs = require('fs'),
        path = require('path');

    return {

        read: function (filePath) {

        },

        write: function (filePath, data, callback) {
            fs.writeFile(filePath, data, 'utf8', callback);
        },

        expandPath: function (filePath, baseDir, callback) {
            var dirs,
                pos = 0,
                absolutePath = path.normalize(baseDir + '/' + filePath);

            function next(dirs, base, pos) {
                if (pos === dirs.length) { // all dirs exist
                    return callback(null);
                }
                pos++;
                mkdir(dirs, base, pos);
            }

            function buildPath(dirs, base, pos) {
                return path.normalize(base + '/' + dirs.slice(0, pos).join('/'));
            }

            function mkdir(dirs, base, pos) {
                var currentPath = buildPath(dirs, base, pos);
                fs.exists(currentPath, function (exists) {
                    if (exists) {
                        next(dirs, base, pos);
                    } else {
                        fs.mkdir(currentPath, function (err) {
                            next(dirs, base, pos);
                        });
                    }
                });
            }

            function start() {
                fs.exists(filePath, function (exists) {
                    if (exists) {
                        return callback(null);
                    }

                    dirs = path.dirname(filePath).split('/');
                    if (!dirs[dirs.length - 1]) { // remove empty element created by trailing slash
                        dirs.pop();
                    }
                    if (!dirs[0]) { // remove empty element created by first slash
                        dirs.unshift();
                    }
                    mkdir(dirs, baseDir, pos);
                });
            }

            fs.exists(baseDir, function (exists) {
                if (!exists) {
                    fs.mkdir(baseDir, function (err) {
                        start();
                    });
                } else {
                    start();
                }
            });

        }

    };

});