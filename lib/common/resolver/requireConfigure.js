define(['json!resolver/paths.json'], function (paths) {

    var configs,
        loader;

    function getLoader(basePath) {
        if (loader) {
            return loader;
        }

        loader = requirejs.config({
        baseUrl: basePath,
        context: 'configloader',
        paths: { // set paths for bootstrapping
            'json': 'lib/vendor/json',
            'text': 'lib/vendor/text',
            'common': 'lib/common'
        }});

        return loader;
    }

     function resolvePath(path, env, options) {
        var basePath;

        if (env === 'server') {
            path = (options.basePath ? options.basePath + '/' : '') + path;
        }

        return path;
    }

    function getPaths(env, options) {
        var _paths = JSON.parse(JSON.stringify(paths)),
            needle = '/{env}/',
            replace = '/' + env + '/';

        for (var k in _paths.common) { // update env specific implementation paths
            _paths.common[k] = resolvePath(_paths.common[k].replace(needle, replace), env, options);
        }
        for (k in _paths[env]) { // merge env specific paths
            _paths.common[k] = resolvePath(_paths[env][k], env, options);
        }

        return _paths.common;
    }

    function augment(receiver, giver) {
        for (var key in giver) {
            receiver[key] = giver[key];
        }

        return receiver;
    }

    configs = {

        client: function (options, callback) {

            function augmentConf(shim, paths) {
                return {
                    baseUrl: '/',
                    map: {
                        '*': {
                            'l': '/lib/client/loader.js'
                        }
                    },
                    paths: augment(getPaths('client', options), paths),
                    shim: shim,
                    inlineText: true,
                    keepBuildDir: true,
                    removeCombined: false,
                    skipDirOptimize: true,
                    crypto: 'md5',
                    outDir: 'optimized',
                    prefix: 'optimized'
                };
            }

            try { // client
                window; // attempt to access window object; if server catch err & use requirejs loader
                // use globals set by server render to simplePage.hbs, lazoShim, lazoPaths
                callback(null, augmentConf(LAZO.initConf.shim, LAZO.initConf.paths));
            } catch (e) { // server
                callback(null, augmentConf(options.shim, options.paths));
            }
        },

        server: function (options, callback) {

            function augmentConf(shim, paths) {
                return {
                    shim: shim || {},
                    baseUrl: options.baseUrl,
                    context: 'application',
                    map: {
                        '*': {
                            's': options.basePath + '/lib/server/loader.js'
                        }
                    },
                    paths: augment(getPaths('server', options), paths)
                };
            }

            callback(null, augmentConf(options.shim, options.paths));
        }

    };

    return {
        get: function (env, options, callback) {
            if (arguments.length === 2) {
                callback = arguments[1];
            }
            return configs[env](options, callback);
        }
    };


});