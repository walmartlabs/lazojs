define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'lazoCtl'
], function (bdd, chai, expect, sinon, sinonChai, utils, LazoController) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Lazo Controller', function () {

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

            it('should get the http status code', function () {
                var dfd = this.async();
                getController({
                    success: function (controller) {

                        controller.ctx.getHttpStatusCode = sinon.stub();
                        controller.getHttpStatusCode();
                        expect(controller.ctx.getHttpStatusCode.calledOnce).to.be.true;

                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                });
            });

            it('should set the http status code', function () {
                var dfd = this.async();
                getController({
                    success: function (controller) {

                        controller.ctx.setHttpStatusCode = sinon.stub();
                        controller.setHttpStatusCode(410);
                        expect(controller.ctx.setHttpStatusCode.calledOnce).to.be.true;

                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                });
            });

            it('should get http vary params', function () {
                var dfd = this.async();
                getController({
                    success: function (controller) {

                        controller.ctx.getHttpVaryParams = sinon.stub();
                        controller.getHttpVaryParams();
                        expect(controller.ctx.getHttpVaryParams.calledOnce).to.be.true;

                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                });
            });

            it('should add http vary params', function () {
                var dfd = this.async();
                getController({
                    success: function (controller) {

                        controller.ctx.addHttpVaryParam = sinon.stub();
                        controller.addHttpVaryParam('accept');
                        expect(controller.ctx.addHttpVaryParam.calledOnce).to.be.true;

                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                });
            });

            it('should add http headers', function () {
                var dfd = this.async();
                getController({
                    success: function (controller) {

                        controller.ctx.addHttpHeader = sinon.stub();
                        controller.addHttpHeader('X-Frame-Options', 'deny');
                        expect(controller.ctx.addHttpHeader.calledOnce).to.be.true;

                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                });
            });

            it('should get http headers', function () {
                var dfd = this.async();
                getController({
                    success: function (controller) {

                        controller.ctx.getHttpHeaders = sinon.stub();
                        controller.getHttpHeaders();
                        expect(controller.ctx.getHttpHeaders.calledOnce).to.be.true;

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