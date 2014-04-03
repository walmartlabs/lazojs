define(['resolver/requireConfigure'], function (requireConf) {

    'use strict';

    var crypto = require('crypto'),
        fs = require('fs'),
        path = require('path');

    return {

        configure: function (include, baseUrl, out) {
            function isAppPath(path) {
                var appPaths = LAZO.contexts.app && LAZO.contexts.app.paths;
                return appPaths[path] ? true : false;
            }

            function getPaths() {
                var paths = _.clone(LAZO.contexts.server.paths);

                for (var key in paths) {
                    if (key !== 'text' && key !== 'json' && !isAppPath(key)) {
                       paths[key] = 'empty:';
                    }
                }

                // set the loader to the client implementation; it cannot be set in a map because it uses the baseUrl
                paths['l'] = LAZO.BASE_PATH + '/lib/client/loader';
                return paths;
            }

            return {
                baseUrl: baseUrl,
                include: include,
                stubModules : ['text', 'json', 'l'],
                paths: getPaths(),
                inlineText: true,
                keepBuildDir: true,
                removeCombined: false,
                skipDirOptimize: true,
                outDir: out,
                prefix: out,
                shim: (LAZO.contexts.app && LAZO.contexts.app.shim) || {}
            };
        },

        bundle: function (options, callback) {
            var md5 = crypto.createHash('md5'),
                comboFileName = options.outFileName || md5.update(options.include.join(''), 'utf8').digest('hex'),
                comboFilePath = path.normalize(options.baseUrl + '/' + options.outDir + '/' + comboFileName + '.js');

            if (!options.include.length) {
                return callback(null, []);
            }

            options.out = comboFilePath;
            fs.exists(comboFilePath, function (exists) {
                var retVal = [path.normalize((options.prefix ? options.prefix + '/' : '') + comboFileName)];

                if (exists && !options.overwrite) {
                    return callback(null, retVal);
                } else {
                    try {
                        requirejs.optimize(options, function (buildTxt) {
                            callback(null, retVal);
                        });
                    } catch (err) {
                        callback(err, null);
                    }
                }
            });
        }

    };

});