describe('Safe Handler', function () {

    var context = {};

    var noop = function () {

    };

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

    before(function (done) {
        requirejs(['castle', 'cluster', 'hapi'], function (castle, cluster, hapi) {
            castle.test({
                module: 'lib/server/handlers/safe',
                globals: [
                    { module: 'lazo', exports: 'LAZO' }
                ],
                callback: function (module) {
                    context.cluster = cluster;
                    context.hapi = hapi;
                    context.safe = module;
                    done();
                }
            });
        });
    });

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

    it('should handle no exceptions', function (done) {
        var server = context.hapi.createServer();

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
            done();
        });
    });

    it('should handle one exception', function (done) {
        var server = context.hapi.createServer();

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
            done();
        });
    });

    it('should handle multiple exceptions', function (done) {
        var server = context.hapi.createServer();

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
                done();
            }, 1000);
        });
    });

});