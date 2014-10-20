define(['module'], function (mod) {

    'use strict';

    var path = require('path');

    var paths = [];

    paths.push(process.cwd() + path.sep + 'node_modules');
    paths.push(LAZO.BASE_PATH + path.sep + 'node_modules');
    paths.push(LAZO.FILE_REPO_PATH + path.sep + 'node_modules');
    paths.push(LAZO.SHARED_REPO_DIR + path.sep + 'node_modules');

    function isClientOnly(name, paths) {
        var names = name.indexOf('/') ? name.split('/') : [name];
        for (var i = 0; i < names.length; i++) {
            if (paths[names[i]] && paths[names[i]].indexOf('/client/') !== -1) {
                return true;
            }
        }

        return false;
    }

    function resolvePath(baseUrl, relativePath) {
        // requirejs adds a "/" to the end of the baseUrl regardless of the OS
        baseUrl = baseUrl.substr(0, baseUrl.length - 1) + path.sep;
        return path.normalize(baseUrl + relativePath);
    }

    function logError(modulePath) {
        if (LAZO && LAZO.logger && LAZO.logger.info) {
            LAZO.logger.info(['server.loader'], 'Tried loading module from path %s', modulePath);
        }
    }

    return {
        load: function (name, req, onload, config) {
            var nodeModule;
            var modulePath;
            var loaded = true;

            //req has the same API as require().
            if (name !== null && name.indexOf('/client/') === -1 && !isClientOnly(name, config.paths)) {
                req([name], function (value) {
                    onload(value);
                }, function (err) {
                    // try to load node module using absolute path
                    modulePath = resolvePath(config.baseUrl, name);

                    try {
                        nodeModule = require.nodeRequire(modulePath);
                        onload(nodeModule);
                    } catch (err) {
                        loaded = false;
                        logError(modulePath);
                        try {
                            loaded = true;
                            // try injecting node_modules directory
                            modulePath = modulePath.substr(0, modulePath.lastIndexOf(path.sep)) + path.sep + 'node_modules' +
                                modulePath.substr(modulePath.lastIndexOf(path.sep));
                            nodeModule = require.nodeRequire(modulePath);
                            onload(nodeModule);
                        } catch (err) {
                            loaded = false;
                            logError(modulePath);
                        }
                    }

                    // try other common paths
                    for (var i = 0; paths.length; i++) {
                        if (loaded) {
                            break;
                        }

                        try {
                            loaded = true;
                            modulePath = paths[i] + path.sep + name;
                            nodeModule = require.nodeRequire(modulePath);
                        } catch (err) {
                            logError(modulePath);
                            loaded = false;
                        }
                    }
                });
            } else {
                //Returning null for client side dependencies on server
                onload(null);
            }
        }
    };

});