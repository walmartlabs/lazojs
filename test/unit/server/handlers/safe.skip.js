define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'hapi',
    'cluster',
    'lib/server/handlers/safe'
], function (bdd, chai, expect, sinon, sinonChai, utils, hapi, cluster, safe) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Safe Handler', function () {

            var context = {
                cluster: cluster,
                hapi: hapi,
                safe: safe
            };

            var noop = function () {};

            var noExceptionHandler = function (request, reply) {
                process.nextTick(function () {
                    reply(null);
                });
            };

            var oneExceptionHandler = function () {
                process.nextTick(function () {
                    throw new Error();
                });
            };

            var multipleExceptionsHandler = function () {
                for (var i = 0; i < 10; i++) {
                    setTimeout(function () {
                        throw new Error();
                    }, Math.round(Math.random() * 1000));
                }
            };

            beforeEach(function () {
                context.clusterIsWorker = context.cluster.isWorker;
                context.cluster.isWorker = false;
                context.processExit = sinon.stub(process, 'exit');
            });

            afterEach(function () {
                context.cluster.isWorker = context.clusterIsWorker;
                process.exit.restore && process.exit.restore();
            });

            it('should create a safe handler', function () {
                var handler = context.safe(context.hapi.createServer(), noop, this);
                expect(handler).to.be.a.function;
            });

            it('should throw exception upon invalid arguments', function () {
                expect(function () {
                    context.safe();
                }).to.throw(TypeError);

                expect(function () {
                    context.safe(context.hapi.createServer());
                }).to.throw(TypeError);
            });

            it('should handle no exceptions', function () {
                var server = context.hapi.createServer();
                var dfd = this.async();

                server.route({
                    handler: context.safe(server, noExceptionHandler, this),
                    method: 'GET',
                    path: '/'
                });

                server.inject({
                    method: 'GET',
                    url: 'http://example.com/'
                }, function (response) {
                    expect(response.statusCode).to.be.equal(200);
                    dfd.resolve();
                });
            });

            it('should handle one exception', function () {
                var server = context.hapi.createServer();
                var dfd = this.async();

                server.route({
                    handler: context.safe(server, oneExceptionHandler, this),
                    method: 'GET',
                    path: '/'
                });

                server.inject({
                    method: 'GET',
                    url: 'http://example.com/'
                }, function (response) {
                    expect(response.statusCode).to.be.equal(500);
                    dfd.resolve();
                });
            });

            it('should handle multiple exceptions', function () {
                var server = context.hapi.createServer();
                var dfd = this.async();

                server.route({
                    handler: context.safe(server, multipleExceptionsHandler, this),
                    method: 'GET',
                    path: '/'
                });

                var serverStopSpy = sinon.spy(server, 'stop');

                server.inject({
                    method: 'GET',
                    url: 'http://example.com/'
                }, function (response) {
                    expect(response.statusCode).to.be.equal(500);

                    setTimeout(function () {
                        expect(serverStopSpy).to.be.called.once;
                        expect(context.processExit).to.be.called.once;
                        dfd.resolve();
                    }, 1000);
                });
            });

        });
    }
});