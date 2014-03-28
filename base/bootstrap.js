define(['resolver/requireConfigure'], function (resolver) {

    resolver.get('client', function (err, config) {
        if (err) { // TODO: error handling
            throw err;
        }

        var lazoRequire = requirejs.config(config);

        // build list of modules loaded for dedupping on the server
        requirejs.getLoadedModuleNames = function () {
            var modules = [];

            for (var i in this.s.contexts) {
                for (var j in this.s.contexts[i].defined) {
                    modules.push(j);
                }
            }

            return modules;
        };

        function bootstrap() {
            lazoRequire(['app/application', 'config', 'jquerycookie', 'handlebars', 'error', 'logger'], function (App, config, jquerycookie, handlebars, error, logger) {

                LAZO.config = config;
                LAZO.app = new App();
                LAZO.error = error;
                LAZO.app.isServer = false;
                LAZO.app.isClient = true;
                LAZO.logger = logger;

                lazoRequire(['clientApp'], function (clientApp) {
                    LAZO.app.args = LAZO.initConf.lazoArgs;
                    lazoRequire(LAZO.app.js, function () {
                        LAZO.app.initialize(function () {
                            clientApp.initialize();
                        });
                    });
                });
            });
        }

        LAZO.require = lazoRequire;
        LAZO.isServer = false;
        LAZO.isClient = true;

        // combo handled modules; these should be loaded first
        if (LAZO.initConf.rootCtx.dependencies.modules) {
            lazoRequire(LAZO.initConf.rootCtx.dependencies.modules, function () {
                bootstrap();
            });
        } else {
            bootstrap();
        }
    });

});