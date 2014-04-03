// TODO: add lib combo handling
var fs = require('fs'),
    path = require('path'),
    requirejs = require('requirejs'),
    http = require('http'),
    bootstrap;

global.LAZO = {
    BASE_PATH: process.env.BASE_PATH,
    BASE_REPO_DIR: process.env.BASE_REPO_DIR,
    FILE_REPO_DIR: process.env.FILE_REPO_DIR,
    SHARED_REPO_DIR: process.env.SHARED_REPO_DIR,
    FILE_REPO_PATH: path.resolve(process.env.FILE_REPO_DIR),
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
    CLUSTER: process.env.CLUSTER,
    ROBUST: process.env.ROBUST === '1'
};

bootstrap = requirejs.config({
    baseUrl: LAZO.BASE_PATH,
    context: 'bootstrap',
    paths: {
        'json': 'lib/vendor/json',
        'text': 'lib/vendor/text',
        'common': 'lib/common',
        'base': 'lib/common/base',
        'resolver': 'lib/common/resolver'
    }
});

// load requireConfigure directly as opposed to resolver/main because resolver
// sub modules have need requirejs to be configured prior to being loaded
bootstrap(['resolver/requireConfigure'], function (requireConfigure) {

    'use strict';

    var options = {
        basePath: LAZO.BASE_PATH,
        baseUrl: LAZO.FILE_REPO_DIR
    };

    requireConfigure.get('server', options, function (err, conf, appConfExtensions) {
        if (err) {
            throw new Error(err);
        }
        var serverConf = conf;

        requireConfigure.get('client', options, function (err, conf) {
            if (err) {
                throw new Error(err);
            }
            var clientConf = conf;

            function addPaths(serverConf) {
                var customBundlerPath = path.normalize(LAZO.FILE_REPO_DIR + '/app/server/bundle.js');
                if (fs.existsSync(customBundlerPath)) {
                    serverConf.paths.bundler = path.resolve(path.normalize(LAZO.FILE_REPO_DIR + '/app/server/bundle')); // use absolute path
                }

                return serverConf;
            }

            LAZO.require = requirejs.config(addPaths(serverConf));
            LAZO.contexts = {
                request: JSON.parse(JSON.stringify(clientConf)), // request combo handling
                lib: JSON.parse(JSON.stringify(clientConf)), // lib combo handling
                server: JSON.parse(JSON.stringify(serverConf)), // paths are used for generating combo handled file
                app: appConfExtensions // application defined shims and paths; used to set globals for client config
            };

            // these are needed by dependencies of lazoApp
            LAZO.isServer = true;
            LAZO.isClient = false;
            // these cannot be loaded until the requirejs app config has been set
            LAZO.require(['app/application', 'config', 'logger'], function (LazoApp, config, logger) {
                LAZO.app = new LazoApp();
                LAZO.app.isServer = LAZO.isServer;
                LAZO.app.isClient = LAZO.isClient;

                LAZO.config = config;

                LAZO.logger = logger;

                // these are dependent on the
                LAZO.require(['server', 'jitc/main', 'resolver/file', 'error'], function (server, jitc, file, err) {

                    LAZO.error = err;

                    // process appArgs command line argument into application.args
                    var args = process.argv.filter(function (elem) {
                        return elem.indexOf('--appArgs') !== -1;
                    });
                    if (args.length) {
                        LAZO.app.args = {};
                        var appArgs = args[0].split('='),
                            args = appArgs[1].split(';');
                        for (var i = 0, il = args.length; i < il; i++) {
                            var arg = args[i].split(':');
                            LAZO.app.args[arg[0]] = arg[1];
                        }
                    }

                    LAZO.logger.warn(['server.app'], 'Initializing with arguments: %j', LAZO.app.args);

                    // read in ssl server config
                    try {
                        LAZO.options = JSON.parse(fs.readFileSync(path.resolve(path.normalize(LAZO.FILE_REPO_DIR + '/config/serverConfig.json'))));
                    }
                    catch (error) {
                        LAZO.options = {};
                        LAZO.logger.warn(['server.app'], 'Failed to load serverConfig.json', error);
                    }

                    // manually setup server config, TODO: should be refactored to be read in from serverConfig.json
                    LAZO.options.server = {
                        port: LAZO.PORT,
                        maxSockets: 500
                    }

                    LAZO.logger.warn(['server.app'], 'Initializing with options: %j', LAZO.options);

                    http.globalAgent.maxSockets = LAZO.options.server.maxSockets;

                    LAZO.app.initialize(function () {
                        // var bundles = 0,
                        //     bundleConf;

                        LAZO.app.js = LAZO.app.js || [];
                        file.getErrorTemplatePaths(function (err, errHandlers) {
                            if (err) {
                                throw err;
                            }

                            LAZO.errorTemplates = errHandlers;
                            server.initialize(errHandlers, function () {
                                if (_.isFunction(LAZO.app.afterServerInitialized)) {
                                    LAZO.app.afterServerInitialized();
                                }
                            });
                        });
                    });
                });
            });
        });
    });

});