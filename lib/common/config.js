/**
 Configuration Provider

 By default, returns environment variables.  Use plugins to support other configuration sources.

 @submodule config
 **/

define(['base', 'async'], function (Base, async) {

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
        BASE_REPO_DIR:  'BASE_REPO_DIR',
        FILE_REPO_DIR:  'FILE_REPO_DIR',
        LAZO_PORT:  'LAZO_PORT',
        MODEL_TIMEOUT:  'MODEL_TIMEOUT',
        MODEL_MOCK:  'MODEL_MOCK',
        CACHE:  'CACHE',
        LAZO_VERSION: 'LAZO_VERSION',

        /**
         Returns the configuration associated with the key.

         @method get
         @param {String} key The key to lookup
         * @param {Object} options
         * <ul>
         *     <li>{String} defaultVal Default value if key not found</li>
         *     <li>{Function} success Callback function for successful call, passed <code>value</code> as argument</li>
         *     <li>{Function} error Callback function for failed call, passed <code>(err)</code> as argument</li>
         * </ul>
         @return {String} if options.success is implemented, it will return null. Otherwise it will return the value if found.
         **/
        get: function (key, options) {

            // if no options success callback only do sync calls for backward compatibility
            if(!options || typeof options.success !== 'function'){
                for(var i=0;i<configs.length;i++){
                    var config = configs[i];
                    var val = config.get(key);
                    if(typeof(val) !== 'undefined' && val !== null){
                        return val;
                    }
                }
                return (options && typeof options === 'object') ? options.defaultVal : options;
            }

            // else attempt async

            var fns = [];
            for(var i=0;i<configs.length;i++){
                var config = configs[i];
                fns.push(function(p1, p2){
                    var val, callback;
                    if(typeof p1 === 'function'){
                        callback = p1;
                    }else{
                        val = p1;
                        callback = p2;
                    }
                    if(typeof(val) !== 'undefined' && val !== null){
                        return callback(null, val);
                    }
                    config.get(key, {success:function(value){
                        return callback(null, value);
                    }});
                })
            }
            async.waterfall(fns, function (err, result) {
                if(err && options && typeof options.error === 'function'){
                    options.error(err);
                }
                return options.success(result);
            });
        },

        /**
         * Adds a config plugin
         * @param plugin Instance of Config.Plugin
         */
        addPlugin: function(plugin){
            configs.push(plugin);
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
        constructor: function(options){
            this.data = {};
        },
        /**
         * Gets the value for a key
         * @param key
         * @return {*}
         */
        get: function(key, options){
            var ret;
            if(this.data && key in this.data){
                ret = this.data[key];
                try{
                    ret = JSON.parse(ret);
                }catch(e){} // ignore JSON parse errors since we only want to parse it if it is JSON
            }
            if(options && typeof options.success === 'function'){
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
        constructor: function(options){
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
        constructor: function(options){
            var self = this;
            LAZO.require(['text!' + options.file], function (text) {
                self.data = JSON.parse(text);
                if(typeof options.success === 'function'){
                    options.success();
                }
            }, function(err){
                if(typeof options.error === 'function'){
                    options.error(err);
                }
            });
        }
    });

    // for server side node.js, initialize with plugin that reads values from process.env
    if(typeof process !== 'undefined' && process.env){
        var envCfg = Config.Plugin.extend({
            constructor: function(options){
                this.data = process.env;
            }
        });
        Config.addPlugin(new envCfg());
    }



    return Config;
});