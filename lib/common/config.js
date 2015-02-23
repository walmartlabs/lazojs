/**
 Configuration Provider

 By default, returns environment variables.  Use plugins to support other configuration sources.

 @submodule config
 **/

define(['base', 'async', 'underscore'], function (Base, async, _) {

    var configs = [];

    function isJsonString(str) {
        if (!str || 0 === str.trim().length) {
            return false;
        }
        str = str.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
        return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
    }

    /**
     * Main configuration class for returning configuration values.
     * @class Config
     * @type {Object}
     */
    var Config = {

        // Configuration keys
        ENV: 'ENV',
        BASE_PATH:  'BASE_PATH',
        FILE_REPO_DIR:  'FILE_REPO_DIR',
        LAZO_PORT:  'LAZO_PORT',
        MODEL_TIMEOUT:  'MODEL_TIMEOUT',
        MODEL_MOCK:  'MODEL_MOCK',
        CACHE:  'CACHE',
        LAZO_VERSION: 'LAZO_VERSION',

        /**
         * Returns the configuration associated with the key.
         *
         * @method get
         * @param {String} key The key to lookup
         * @param {Object} options
         * <ul>
         *     <li>{String} defaultVal Default value if the key is not found</li>
         *     <li>{Object} context The context that in which a configuration is to be retrieved.</li>
         *     <li>{Function} success Callback function for successful call, passed <code>value</code> as argument</li>
         *     <li>{Function} error Callback function for failed call, passed <code>(err)</code> as argument</li>
         * </ul>
         * @return {String} if options.success is implemented, it will return null. Otherwise it will return the value if found.
         **/
        get: function (key, options) {
            return this.resolve(key, configs, options);
        },

        resolve: function (key, configs, options) {
            var len = configs.length;
            var config;
            var val;
            var i;
            var fns = [];

            // if no options success callback only do sync calls for backward compatibility
            if (!options || !_.isFunction(options.success)) {
                for (i = len; i--;) {
                    config = configs[i];
                    val = config.get(key, options);
                    if (!_.isUndefined(val)) {
                        return val;
                    }
                }

                return _.isObject(options) ? options.defaultVal : options;
            }

            var fn = function(p1, p2){
                var val;
                var callback;

                if (_.isFunction(p1)) {
                    callback = p1;
                } else {
                    val = p1;
                    callback = p2;
                }
                if (!_.isUndefined(val)) {
                    return callback(null, val);
                }
                this.get(key, { success: function (value) {
                    return callback(null, value);
                }, context: options.context});
            };

            // else attempt async
            for (i = len; i--;) {
                fns.push(fn.bind(configs[i]));
            }

            async.waterfall(fns, function (err, result) {
                if (err && _.isFunction(options.error)) {
                    return options.error(err);
                }

                options.success(result);
            });
        },

        /**
         * Adds a config plugin
         * @param plugin Instance of Config.Plugin
         */
        addPlugin: function (plugin) {
            configs.push(plugin);
        },

        clearPlugins: function () {
            configs.length = 0
        }

    };

    /**
     * Base configuration plugin.
     * @class Config.Plugin
     * @type {*|Object|Object}
     */
    Config.Plugin = Base.extend({
        /**
         * Constructor
         * @param options
         */
        constructor: function (options) {
            this.data = {};
        },
        /**
         * Gets the value for a key
         * @param key
         * @return {*}
         */
        get: function (key, options) {
            var ret;
            if (this.data && key in this.data) {
                ret = this.data[key];
                try {
                    ret = JSON.parse(ret);
                } catch (e) {} // ignore JSON parse errors since we only want to parse it if it is JSON
            }
            if (options && _.isFunction(options.success)) {
                options.success(ret);
            }

            return ret;
        }
    });

    /**
     * Static configuration data plugin. Pass in a hash as options.data.
     * <p>Example: var cfg = new Config.HashPlugin({data:{key:"value"}});
     * @type {*|Object|Object}
     * @class Config.HashPlugin
     * @extends Config.Plugin
     */
    Config.HashPlugin = Config.Plugin.extend({
        constructor: function (options) {
            this.data = options.data;
        }
    });

    /**
     * JSON configuration file plugin. Pass in file as options.file. It will be loaded by requirejs
     * <p>Example: var cfg = new Config.JSONPlugin({file:"app/appProperties.json"});
     * @type {*|Object|Object}
     * @class Config.JSONPlugin
     * @extends Config.Plugin

     */
    Config.JSONPlugin = Config.Plugin.extend({
        constructor: function(options) {
            var self = this;
            LAZO.require(['text!' + options.file], function (text) {
                self.data = JSON.parse(text);
                if (_.isFunction(options.success)) {
                    options.success();
                }
            }, function(err){
                if (_.isFunction(options.error)) {
                    options.error(err);
                }
            });
        }
    });

    // for server side node.js, initialize with plugin that reads values from process.env
    if (LAZO.isServer && process.env) {
        var envCfg = Config.Plugin.extend({
            constructor: function (options) {
                this.data = process.env;
            }
        });

        Config.addPlugin(new envCfg());
    }

    return Config;
});