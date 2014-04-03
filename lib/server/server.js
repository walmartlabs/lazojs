define([
    'handlers/app/main',
    'handlers/assets',
    'cluster',
    'handlers/ctlNavigate',
    'fs',
    'hapi',
    'path',
    'resolver/main',
    'handlers/safe',
    'handlers/stream',
    'handlers/tunnel'
], function (appHandler, assetsHandler, cluster, ctlNavHandler, fs, hapi, path, resolver, safeHandler, streamHandler, tunnelHandler) {

    'use strict';

    return {

        initialize: function (errHandlers, cb) {
            LAZO.logger.warn(['server.initialize'], 'Initializing server...')

            this.errHandlers = errHandlers;
            this.cb = cb;
            this._cluster(); // cluster server if !this.DEV
        },

        _worker: function () {
            this._create() // create server instance
                ._views()
                ._extensions() // server extensions
                ._routes() // define app routes and add app handlers
                ._handlers() // add all other route handlers
                ._error() // init logger & error handling
                ._start();
        },

        _create: function () {
            LAZO._server = this.server = new hapi.Server('0.0.0.0', LAZO.options.server.port, {
                debug: false,
                maxSockets: LAZO.options.server.maxSockets,
                payload: { maxBytes: 10485760 },
                state: { cookies: { failAction: 'log', strictHeader: false } }
            });

            if (LAZO.options.sslServer) {
                LAZO._sslServer  = this.sslServer = new hapi.Server('0.0.0.0', LAZO.options.sslServer.port, {
                    debug: false,
                    maxSockets: LAZO.options.sslServer.maxSockets,
                    payload: { maxBytes: 10485760 },
                    state: { cookies: { failAction: 'log', strictHeader: false } },
                    tls: {
                        key: fs.readFileSync(path.resolve(path.normalize(LAZO.FILE_REPO_DIR + '/config/' + LAZO.options.sslServer.tls.key))),
                        cert: fs.readFileSync(path.resolve(path.normalize(LAZO.FILE_REPO_DIR + '/config/' + LAZO.options.sslServer.tls.cert)))
                    }
                });
            }
            return this;
        },

        _views: function () {
            var viewOptions = {
                engines: {
                    hbs: {
                        module: 'handlebars'
                    }
                },
                allowAbsolutePaths: true
            };
            this.server.views(viewOptions);
            this.sslServer && this.sslServer.views(viewOptions);

            return this;
        },

        _extensions: function () {
            var self = this;

            var preResponseHandler = function (request, next) {
                var response = request.response();

                // if server render fails then send up HTML view, else return JSON error object
                if (response.isBoom) {
                    LAZO.logger.error(['server._extensions'], 'Internal server error', request.url.href, response.response.code, response.message, response.trace);

                    if (LAZO.CLUSTER && !LAZO.ROBUST && response.response.code >= 500 && response.response.code <= 599) {
                        self._stop();
                    }

                    if (request.raw.req.headers['x-requested-with'] !== 'XMLHttpRequest') {
                        var errHandler = self.errHandlers[response.response.code];

                        if (errHandler) {
                            return next(request.generateView(errHandler.server, response.response.payload));
                        }
                    }
                }

                return next();
            };
            this.server.ext('onPreResponse', preResponseHandler);
            this.sslServer && this.sslServer.ext('onPreResponse', preResponseHandler);

            return this;
        },

        _routes: function () {
            var self = this,
                routes,
                routeDefs = LAZO.routes,
                processRoute = function (route, svr) {
                    routes = resolver.transformRoute(route);

                    if (routes.routeNoTrailingSlash) {
                        self._addAppRouteHandler('GET', routes.routeNoTrailingSlash, route, svr);
                        self._addAppRouteHandler('POST', routes.routeNoTrailingSlash, route, svr);
                    }

                    self._addAppRouteHandler('GET', routes.route, route, svr);
                    self._addAppRouteHandler('POST', routes.route, route, svr);
                };

            // give server a reference to routes, used later when handling the routes
            this.server._routes = routeDefs;

            for (var route in routeDefs) {
                processRoute(route, this.server);
            }

            if (LAZO.options.sslServer && LAZO.options.sslServer._routes) {
                // give ssl server a reference to routes, used later when handling the routes
                this.sslServer._routes = LAZO.options.sslServer._routes;
                for (var route in LAZO.options.sslServer._routes) {
                    processRoute(route, this.sslServer);
                }
            }
            return this;
        },

        _addAppRouteHandler: function (method, path, route, svr) {
            var self = this,
                definition = { method: method, path: path };

            if (method === 'GET') {
                definition.handler = function (request) {
                    appHandler(request, route, svr);
                };
            } else {
                definition.config = {
                    handler: function (request) {
                        appHandler(request, route, svr);
                    },
                    payload: 'parse'
                };
            }

            this._setServerRoute([svr], definition);

            return this;
        },

        _handlers: function () {
            this._tunnelHandler()
                ._assetsHandler()
                ._staticFilesHandler()
                ._ctlNavigate();

            return this;
        },

        _tunnelHandler: function () {
            var tunnelOptions = {
                method: 'POST',
                path: '/tunnel',
                config: {
                    handler: tunnelHandler,
                    payload: 'parse'
                }
            };

            this._setServerRoute([this.server, this.sslServer], tunnelOptions);

            var postFcaOptions = {
                method: 'POST',
                path: '/fn/{compName}/{action}',
                config: {
                    handler: streamHandler,
                    payload: 'parse'
                }
            };

            this._setServerRoute([this.server, this.sslServer], postFcaOptions);

            var postFaOptions = {
                method: 'POST',
                path: '/fn/{action}',
                config: {
                    handler: streamHandler,
                    payload: 'parse'
                }
            };

            this._setServerRoute([this.server, this.sslServer], postFaOptions);

            var getFcaOptions = {
                method: 'GET',
                path: '/fn/{compName}/{action}',
                config: {
                    handler: streamHandler
                }
            };

            this._setServerRoute([this.server, this.sslServer], getFcaOptions);

            var getFaOptions = {
                method: 'GET',
                path: '/fn/{action}',
                config: {
                    handler: streamHandler
                }
            };

            this._setServerRoute([this.server, this.sslServer], getFaOptions);

            return this;
        },

        _assetsHandler: function () {
            var assetOptions = {
                method: 'GET',
                path: '/assets',
                handler: assetsHandler
            };

            this._setServerRoute([this.server, this.sslServer], assetOptions);

            return this;
        },

        _staticFilesHandler: function () {
            var pathsOptions = {
                method: 'GET',
                path: '/{path*}',
                handler: {
                    directory: {
                        path: [
                            LAZO.BASE_REPO_DIR,
                            LAZO.FILE_REPO_DIR,
                            LAZO.BASE_PATH,
                            LAZO.BASE_PATH + '/lib'
                        ],
                        listing: true,
                        index: true
                    }
                }
            };

            this._setServerRoute([this.server, this.sslServer], pathsOptions);

            var libOptions = {
                method: 'GET',
                path: '/lib/{path*}',
                handler: {
                    directory: { path: [LAZO.BASE_PATH + '/lib'], listing: true, index: true }
                }
            };

            this._setServerRoute([this.server, this.sslServer], libOptions);

            var baseOptions = {
                method: 'GET',
                path: '/base/{path*}',
                handler: {
                    directory: { path: [LAZO.BASE_PATH + '/base'], listing: true, index: true }
                }
            };

            this._setServerRoute([this.server, this.sslServer], baseOptions);

            return this;
        },

        _ctlNavigate: function () {
            var navOptions = {
                method: 'POST',
                path: '/navigate',
                config: {
                    handler: ctlNavHandler,
                    payload: 'parse'
                }
            };

            this._setServerRoute([this.server, this.sslServer], navOptions);

            return this;
        },

        _error: function () {
            var ev = this.server.on ? this.server : this.server.events;

            ev.on('internalError', function (request, error) {
                LAZO.logger.debug(['server._error'], 'Internal server error', request, error);
            });

            return this;
        },

        _start: function () {
            var self = this;

            this.server.pack.require('crumb', [
                { ext: true }
            ], function (err) {
                if (!err) {
                    self.server.start();
                    if (!self.sslServer) {
                        self.cb();
                    }
                }
            });

            this.sslServer && this.sslServer.pack.require('crumb', [
                { ext: true }
            ], function (err) {
                if (!err) {
                    self.sslServer.start();
                    self.cb();
                }
                else {
                    LAZO.logger.error(['server._start'], 'Error while starting SSL server...', err);
                }
            });

            return this;
        },

        _stop: function () {
            var self = this;
            try {
                if (cluster.isWorker) {
                    cluster.worker.disconnect();
                }

                this.server.stop(function () {
                    if (!self.sslServer) {
                        return process.exit(1);
                    }

                    self.sslServer.stop(function () {
                        process.exit(1);
                    });
                });

            } catch (err) {
                LAZO.logger.error(['server._stop'], 'Error while stopping server and disconnecting worker.', err);
            }
        },

        _cluster: function () {
            var cpus,
                sslPort = LAZO.options.sslServer && LAZO.options.sslServer.port;

            if (!LAZO.CLUSTER) {
                this._worker();
                LAZO.logger.warn(['server._cluster'], 'Server started with single process, listening on port %d (SSL=%d)...',
                    LAZO.PORT, sslPort);
                return this;
            }

            cpus = process.env['CLUSTER'];

            if (cluster.isMaster) {
                for (var i = 0; i < cpus; i++) {
                    cluster.fork();
                }

                cluster.on('online', function (worker) {
                    LAZO.logger.warn(['server._cluster'], 'Worker %d:%d is online.', worker.id, worker.process.pid);
                });

                cluster.on('disconnect', function (worker) {
                    LAZO.logger.warn(['server._cluster'], 'Worker %d:%d was disconnected.', worker.id,
                        worker.process.pid);
                    cluster.fork();
                });
            } else {
                this._worker();
                LAZO.logger.warn(['server._cluster'], 'Server started with %d workers, listening on port %d (SSL=%d)...', cpus, LAZO.PORT, sslPort);
            }

            return this;
        },

        _setServerRoute: function (servers, options) {
            var self = this;

            servers.forEach(function (server) {
                if (!server) {
                    return;
                }

                if (LAZO.ROBUST && typeof options.handler === 'function') {
                    options.handler = safeHandler(server, options.handler, self);
                }

                server.route(options);
            });
        }

    };

});
