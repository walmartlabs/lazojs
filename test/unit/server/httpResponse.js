define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'httpResponse',
    'lazoCtl',
    'context'
], function (bdd, chai, expect, sinon, sinonChai, utils, httpResponse, LazoController, Context) {
    chai.use(sinonChai);

    with (bdd) {
        describe('httpResponse', function () {

            var getController = function (options) {
                var ctlOptions = {
                    name: 'home',
                    ctx: {
                        response: {
                            statusCode: null,
                            httpHeaders: [],
                            varyParams: []
                        }
                    }
                };

                var MyController = LazoController.extend({});
                MyController.create('home', ctlOptions, options);
            };

            it('can add httpHeader', function () {

                var count = httpResponse.getHttpHeaders().length;
                httpResponse.addHttpHeader('X-Frame-Options', 'deny');
                expect(httpResponse.getHttpHeaders().length).to.equal(count + 1);

            });

            it('can add vary param', function () {

                var count = httpResponse.getVaryParams().length;
                httpResponse.addVaryParam('user-agent');
                expect(httpResponse.getVaryParams().length).to.equal(count + 1);

            });

            it('can merge http response data', function () {

                var dfd = this.async();
                getController({
                    success: function (myController) {
                        var controller = myController;
                        var headerCount = httpResponse.getHttpHeaders().length;
                        var varyCount = httpResponse.getVaryParams().length;

                        var getHttpStatusCodeStub = sinon.stub(controller, 'getHttpStatusCode').returns(410);
                        var getHttpHeadersStub = sinon.stub(controller, 'getHttpHeaders').returns({name: 'X-XSS-Protection', value: '1; mode=block'});
                        var getHttpVaryParamsStub = sinon.stub(controller, 'getHttpVaryParams').returns(['accept']);

                        var responseData = httpResponse.mergeHttpResponseData(controller);
                        expect(responseData).to.exist;
                        expect(responseData.statusCode).to.equal(410);
                        expect(responseData.httpHeaders.length).to.equal(headerCount + 1);
                        expect(responseData.varyParams.length).to.equal(varyCount + 1);
                        expect(getHttpStatusCodeStub.calledOnce).to.be.true;
                        expect(getHttpHeadersStub.calledOnce).to.be.true;
                        expect(getHttpVaryParamsStub.calledOnce).to.be.true;

                        getHttpStatusCodeStub.restore();
                        getHttpHeadersStub.restore();
                        getHttpVaryParamsStub.restore();

                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                });

            });

        });
    }
});