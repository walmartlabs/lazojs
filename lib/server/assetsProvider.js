define(['underscore', 'resolver/assets', 'node-dir', 'path', 'fs'],
    function (_, utils, dir, path, fs) {

    'use strict';

    return _.extend({

        _cache: {

        },

        // resolve component path for listing assets directory contents
        _resolvePath: function (component) {
            var pathParts = component === 'app' ? ['app'] : ['components'];
            if (component !== 'app') {
                pathParts.push(component);
            }
            pathParts.push('assets');

            return path.resolve(LAZO.FILE_REPO_PATH + path.sep + path.join.apply(this, pathParts));
        },

        _getLocaleFromPath: function (assetPath) {
            var pathParts = assetPath.split(path.sep);
            return pathParts.length > 1 ? pathParts[0] : 'defaults';
        },

        // transform windows path for web url
        _transformPath: function (path) {
            return path.replace(/\\/g, '/');
        },

        // strip  ABSOLUTE_PATH/assets from path
        _getRelativePaths: function (files, component) {
            var self = this;
            return files.map(function (file) {
                return file.replace(path.normalize(self._resolvePath(component) + path.sep), '');
            });
        },

        // iterate over component map and resolve assets
        _resolveComponentsAssets: function (map, ctx) {
            for (var k in map) {
                map[k] = this.resolveAssets(map[k], ctx);
            }

            return map;
        },

        get: function (components, ctx, options) {
            var loaded = 0;
            var assets = {};
            var self = this;

            function onDone(assets, ctx) {
                assets = self._resolveComponentsAssets(assets, ctx);
                _.extend(self._cache, assets);
                return assets;
            }

            for (var i = 0; i < components.length; i++) {
                assets[components[i]] = {};
                if (this._cache[components[i]]) {
                    assets[components[i]] = this._cache[components[i]];
                    loaded++;
                    if (loaded === components.length) {
                        return options.success(assets);
                    }
                    continue;
                }

                (function (i) {
                    var cmpPath = self._resolvePath(components[i]);

                    fs.exists(cmpPath, function (exists) {
                        if (exists) {
                            dir.files(cmpPath, function (err, files) {
                                loaded++;

                                if (err) {
                                    LAZO.logger.warn('[assets.get] error reading component directory.', err);
                                } else {
                                    var j = files.length;
                                    // remove 'assets[path.sep]'
                                    files = self._getRelativePaths(files, components[i]);

                                    while (j--) {
                                        var locale = self._getLocaleFromPath(files[j]);
                                        if (_.isUndefined(assets[components[i]][locale])) {
                                            assets[components[i]][locale] = {};
                                        }

                                        if (/strings\.json$/.test(files[j])) { // read assets property file
                                            loaded--;
                                            (function (locale, cmpPath) {
                                                fs.readFile(path.resolve(cmpPath + path.sep + files[j]), function (err, strings) {
                                                    loaded++;
                                                    if (err) {
                                                        LAZO.logger.warn('[assets.get] error reading component property file.', err);
                                                    } else {
                                                        try {
                                                            strings = JSON.parse(strings);
                                                            _.extend(assets[components[i]][locale], strings);
                                                        } catch (e) {
                                                            LAZO.logger.warn('[assets.get] error parsing component property file.', e);
                                                        }
                                                    }

                                                    if (loaded === components.length) {
                                                        options.success(onDone(assets, ctx));
                                                    }
                                                });
                                            })(locale, cmpPath);
                                        } else { // add assets file
                                            files[j] = self._transformPath(files[j]);
                                            assets[components[i]][locale][self.resolveAssetKey(files[j])] = self.resolveAssetPath(files[j], components[i], ctx);
                                        }
                                    }
                                }

                                if (loaded === components.length) {
                                    options.success(onDone(assets, ctx));
                                }
                            });
                        } else {
                            loaded++;
                            if (loaded === components.length) {
                                options.success(onDone(assets, ctx));
                            }
                        }
                    });


                })(i);
            }
        }

    }, utils);

});