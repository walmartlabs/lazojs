/*global define:false, LAZO:false*/

define(['underscore', 'async', 'fs', 'path'], function (_, async, fs, path) {

    var invoke = function (callback) {
        if (typeof callback !== 'function') {
            return;
        }

        callback.apply(this, _.rest(arguments));
    };

    var scanDir = function (baseDir, callback) {
        fs.readdir(baseDir, function (error, files) {
            if (error || !files) {
                return callback(null, null);
            }

            var tasks = _.map(files, function (file) {
                return function (callback) {
                    var fullPath = path.join(baseDir, file);

                    fs.stat(fullPath, function (error, stats) {
                        if (error || !stats) {
                            return callback(null, null);
                        }

                        if (stats.isDirectory()) {
                            return scanDir(fullPath, callback);
                        }

                        if (stats.isFile()) {
                            return callback(null, fullPath);
                        }

                        callback(null, null);
                    });
                };
            });

            async.parallel(tasks, function (error, result) {
                callback(error, _.flatten(result));
            });
        });
    };

    var AssetsProvider = LAZO.app.assets.Provider.extend({

        _cache: {},

        /**
         * Scans the assets directory and return the asset list.
         * @param {Object} options
         * @param {String} options.componentName If specified, returns the asset list for the given component (stored
         * under 'components/[componentName]/assets' directory), otherwise returns the list of assets for the
         * application (stored under 'app/assets' directory).
         * @param {Function} options.success The success callback.
         * @param {Function} options.error The error callback.
         */
        list: function (options) {
            if (!options) {
                return;
            }

            if(typeof options.componentName === 'string'){
                options.componentName = [options.componentName];
            }

            var fns = {};
            fns['app'] = function(callback){
                var assetsPath = path.join(LAZO.FILE_REPO_DIR, 'app', 'assets');
                scanDir(assetsPath, function (error, files) {
                    if (error) {
                        return callback(error);
                    }

                    var start = assetsPath.length + 1;

                    files = _.map(files, function (file) {
                        return file.substr(start);
                    });

                    callback(null, files);
                }.bind(this));
            };
            _.each(options.componentName, function(componentName){
                fns[componentName] = function(callback){
                    var assetsPath = path.join(LAZO.FILE_REPO_DIR, 'components', componentName, 'assets');
                    scanDir(assetsPath, function (error, files) {
                        if (error) {
                            return callback(error);
                        }

                        var start = assetsPath.length + 1;

                        files = _.map(files, function (file) {
                            return file.substr(start);
                        });

                        callback(null, files);
                    }.bind(this));
                };
            });

            async.parallel(fns, function(err, data){
                if(err){
                    return options.error(err);
                }
                options.success(data);
            });
        }

    });

    return AssetsProvider;
});