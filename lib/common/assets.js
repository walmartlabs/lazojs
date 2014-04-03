/*global define:false, requirejs:false, LAZO:false */

/**
 * The assets manager module.
 *
 * @submodule assets
 */
define(['underscore', 'async', 'base'], function (_, async, Base) {

    /**
     * The default locale (empty string by convention).
     *
     * @type {String}
     */
    var DEFAULT_LOCALE = '';

    /**
     * Convenience method for invoking callback functions. Does nothing if callback is not a function.
     *
     * @param {Function} callback A callback function.
     * @param {*} [args*] Arguments to be passed to the callback function.
     */
    var invoke = function (callback) {
        if (typeof callback !== 'function') {
            return;
        }

        callback.apply(this, _.rest(arguments));
    };

    /**
     * Base type for custom providers required by the DefaultPlugin.
     *
     * @class assets.Provider
     * @constructor
     * @extends Base
     */
    var Provider = Base.extend({

        /**
         * Lists the assets for a given component or shared at application level.
         *
         * @method list
         * @param {Object} [options] The options object.
         *  @param {String} [options.componentName] The component name. If omitted, lists the application assets.
         *  @param {Function} [options.success] The success callback function.
         *  @param {Function} [options.error] The error callback function.
         */
        list: function () {
            throw new Error('This method must be override by implementor.');
        }

    });

    /**
     * Base type for custom plugins.
     *
     * @class assets.Plugin
     * @extends Base
     */
    var Plugin = Base.extend({

        /**
         * Resolves the asset map for the given component and context.
         *
         * @param {String} componentName The component name.
         * @param {Object} context The context object.
         * @param {Object} [options] The options object.
         *  @param {Function} [options.success] The success callback function.
         *  @param {Function} [options.error] The error callback function.
         * @method map
         */
        map: function () {
            throw new Error('This method must be override by implementor.');
        }

    }, {

        /**
         * Parses the request object and returns an array of locales.
         *
         * @param {Object} request A request object.
         * @returns {Array} A locale array.
         * @private
         * @static
         */
        _getLocales: function (request) {
            var acceptLanguage = request && request.raw && request.raw.req && request.raw.req.headers &&
                request.raw.req.headers['accept-language'];
            return this._parseAcceptLanguage(acceptLanguage);
        },

        /**
         * Loads the JSON file containing the strings map and returns the parsed object.
         *
         * @param {String} path
         * @param {Object} [options] The options object.
         *  @param {Function} [options.success] The success callback function.
         *  @param {Function} [options.error] The error callback function.
         * @private
         * @static
         */
        _loadStrings: function (path, options) {
            LAZO.require(['text!' + path.substr(1)], function (strings) {
                try {
                    invoke(options.success, JSON.parse(strings));
                } catch (error) {
                    invoke(options.error, error);
                }
            }, function (error) {
                invoke(options.error, error);
            });
        },

        /**
         * Parses the contents of the 'accept-language' header and returns an array of locales.
         *
         * @param {String} acceptLanguage The contents of 'accept-language' header.
         * @returns {Array} An array of locales.
         * @private
         * @static
         */
        _parseAcceptLanguage: function (acceptLanguage) {
            var pattern = /^(([a-z]{2})(?:-[A-Z]{2})?)/;
            var match = acceptLanguage && pattern.exec(acceptLanguage || '');
            return match ? _.compact(_.uniq(_.rest(match))).concat(DEFAULT_LOCALE) : [DEFAULT_LOCALE];
        }

    });

    /**
     * The default assets plugin scans the contents of 'app/assets' and 'component/[componentName]/assets' directories
     * in order to return the application and component assets maps.
     *
     * @class assets.DefaultPlugin
     * @extends Plugin
     * @constructor
     */
    var DefaultPlugin = Plugin.extend({

        _appCache: null,

        _componentCache: null,

        _options: null,

        _serverProvider: null,

        /**
         * Creates a DefaultPlugin instance.
         *
         * @param {Object} [options] The options object.
         *  @param {Provider} provider A provider instance. The provider must return an asset list. The DefaultPlugin
         *  takes a client and server provider, both return the contents os 'app/assets' and
         *  'component/[componentName]/assets' directories.
         *  @param {String} [strings='strings.json'] The name of the file that contains the strings map.
         * @constructor
         */
        constructor: function (options) {
            var defaults = {
                strings: 'strings.json'
            };

            this._options = _.defaults(options || {}, defaults);

            if (!(this._options.provider instanceof Provider)) {
                throw new TypeError('Invalid provider.');
            }
        },

        /**
         * Resolves the asset map for the given component and context.
         *
         * @param {String} componentName The component name.
         * @param {Object} context The context object.
         * @param {Object} [options] The options object.
         *  @param {Function} [options.success] The success callback function.
         *  @param {Function} [options.error] The error callback function.
         * @method map
         */
        map: function (componentName, context, options) {
            if (!componentName || !context || !options) {
                throw new TypeError();
            }

            var self = this;
            var request = context && context._rawReq;
            var locales = Plugin._getLocales(request);
            var locale = locales && locales[0] || DEFAULT_LOCALE;

            var onMaps = function (error, maps) {
                if (error) {
                    return invoke(options.error, error);
                }

                invoke(options.success, maps);
            };

            var onAssetsList = function (error, assetsLists) {
                if (error) {
                    return invoke(options.error, error);
                }

                var mapsTasks = {};

                _.each(assetsLists, function(assets, component){
                    mapsTasks[component] = function (callback) {
                        if (!self._componentCache) {
                            self._componentCache = {};
                        }

                        if (!self._componentCache[component]) {
                            self._componentCache[component] = {};
                        }

                        if (self._componentCache[component][locale]) {
                            return callback(null, self._componentCache[component][locale]);
                        }

                        var assetsPath;
                        if(component === 'app'){
                            assetsPath = '/app/assets/';
                        }else{
                            assetsPath = '/components/' + component + '/assets/';
                        }

                        self.constructor._map(assetsPath, locales, assets, self._options.strings, {
                            success: function (map) {
                                self._componentCache[component][locale] = map;
                                callback(null, map);
                            },
                            error: function (error) {
                                callback(error, null);
                            }
                        });
                    };
                });

                async.parallel(mapsTasks, onMaps);
            };

            self._options.provider.list({
                componentName: componentName,
                success: function (list) {
                    onAssetsList(null, list);
                },
                error: function (error) {
                    onAssetsList(error, null);
                }
            });
        }

    }, {

        /**
         * Resolves the asset map for the given arguments.
         *
         * @param {String} basePath The base path where the assets are located.
         * @param {Array} localeList An array of locales to resolve the assets.
         * @param {Array} assetList An array of assets (application or component).
         * @param {String} stringsFile The name of the file that contains the strings map (i.e. 'strings.json').
         * @param {Object} [options] The options object.
         *  @param {Function} [options.success] The success callback function.
         *  @param {Function} [options.error] The error callback function.
         * @private
         * @static
         */
        _map: function (basePath, localeList, assetList, stringsFile, options) {
            var map = {};

            _.each(localeList, function (locale) {
                var filterPattern = locale ? new RegExp('^' + locale + '/.+') : /^(?![a-z]{2}(?:-[A-Z]{2})?\/).+/;

                var filtered = _.filter(assetList, function (asset) {
                    return filterPattern.test(asset);
                });

                var keyPattern = /^(?:[a-z]{2}(?:-[A-Z]{2})?\/)(.+)/;

                _.each(filtered, function (asset) {
                    var key = asset.replace(keyPattern, '$1');

                    if (map[key]) {
                        return;
                    }

                    map[key] = basePath + asset;
                });
            });

            if (map[stringsFile]) {
                return Plugin._loadStrings(map[stringsFile], {
                    success: function (strings) {
                        delete map[stringsFile];
                        invoke(options.success, _.extend(map, strings));
                    },
                    error: function (error) {
                        invoke(options.error, error);
                    }
                });
            }else{
                invoke(options.success, map);
            }
        }
    });


    var assets = (function () {

        /**
         * The current plugin.
         *
         * @type {Plugin}
         * @private
         */
        var plugin = null;

        /**
         * Returns the current plugin set.
         *
         * @returns {Plugin} The current plugin set.
         * @method getPlugin
         * @static
         */
        var getPlugin = function () {
            return plugin;
        };

        /**
         * Resolves the asset map for the given component and context.
         *
         * @param {String} componentName The component name.
         * @param {Object} context The context object.
         * @param {Object} [options] The options object.
         *  @param {Function} [options.success] The success callback function.
         *  @param {Function} [options.error] The error callback function.
         * @method map
         */
        var map = function (componentName, context, options) {
            if (plugin === null) {
                throw new Error('Plugin has not been set.');
            }

            plugin.map(componentName, context, options);
        };

        /**
         * Sets the assets plugin.
         *
         * @param {Plugin} newPlugin The plugin to be used.
         * @throws TypeError If the provided plugin is not derived from Plugin.
         * @method setPlugin
         * @static
         */
        var setPlugin = function (newPlugin) {
            if (!(newPlugin instanceof Plugin)) {
                throw new TypeError();
            }

            plugin = newPlugin;
        };

        return {
            Provider: Provider,
            DefaultPlugin: DefaultPlugin,
            getPlugin: getPlugin,
            map: map,
            Plugin: Plugin,
            setPlugin: setPlugin
        };
    }());

    return assets;
});