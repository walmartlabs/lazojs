define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'lazoApp'
], function (bdd, chai, expect, sinon, sinonChai, utils, LazoApp) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Lazo Application - server', function () {

            it('should add http vary params', function () {

                var lazoApp = new LazoApp({});
                lazoApp.isServer = true;
                var count = lazoApp.getHttpVaryParams().length;
                var app = lazoApp.addHttpVaryParam('user-agent');

                var params = lazoApp.getHttpVaryParams();
                expect(params.length).to.equal(count + 1);
                expect(params[0]).to.equal('user-agent');
                expect(app == lazoApp).to.be.true;

            });

            it('should add http headers', function () {
                var lazoApp = new LazoApp({});
                lazoApp.isServer = true;
                var count = lazoApp.getHttpHeaders().length;
                var app = lazoApp.addHttpHeader('X-Frame-Options', 'deny');

                var headers = lazoApp.getHttpHeaders();
                expect(headers.length).to.equal(count + 1);
                expect(headers[0].name).to.equal('X-Frame-Options');
                expect(headers[0].value).to.equal('deny');
                expect(headers[0].options).to.equal(null);
                expect(app == lazoApp).to.be.true;
            });

            it('should add tunnel filter', function () {
                var lazoApp = new LazoApp({});
                lazoApp.isServer = true;
                var tunnelFilter = {
                    onRequest: function (method, modelOrArgs, params, options) {},
                    onSuccess: function (model, response, options) {},
                    onError: function (model, response, options) {}
                };

                var fn = function () {
                    lazoApp.addTunnelFilter(tunnelFilter);
                };
                expect(fn).to.not.throw();
            });
        });
    }
});