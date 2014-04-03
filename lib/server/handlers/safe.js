define(['cluster', 'domain', 'hapi'], function (cluster, domain, hapi) {

    var onServerStop = function () {
        LAZO.logger.error(['server.handlers.safe'], 'Server stopped. Killing process...');
        process.exit(1);
    };

    return function (server, handler, context) {
        if (!server || server.constructor !== hapi.Server) {
            throw new TypeError();
        }

        if (typeof handler !== 'function') {
            throw new TypeError();
        }

        return function (request, reply) {
            var handlerArgs = arguments;
            var handlerDomain = domain.create();
            var uncaughtCount = 0;

            handlerDomain.on('error', function (error) {
                LAZO.logger.error(['server.handlers.safe'], 'Unhandled error: %s %j', error.message, error.stack);

                switch (uncaughtCount++) {
                    case 0:
                        reply(error);
                        break;
                    case 1:
                        if (cluster.isWorker) {
                            cluster.worker.disconnect();
                        }
                        LAZO.logger.error(['server.handlers.safe'], 'Stopping server...');
                        server.stop(onServerStop);
                        break;
                    default:
                        // Ignore
                        break;
                }
            });

            handlerDomain.run(function () {
                handler.apply(context || this, handlerArgs);
            });
        };
    };

});
