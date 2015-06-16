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

            var controller;

            var getController = function (options) {
                var ctlOptions = {
                    name: 'home',
                    ctx: {
                        response: {
                            statusCode: null,
                            httpHeaders: [],
                            varyParams: []
                        },
                        getHttpHeaders: function () {
                            return [];
                        },
                        getHttpVaryParams: function () {
                            return [];
                        }
                    }
                };

                var MyController = LazoController.extend({});
                MyController.create('home', ctlOptions, options);
            };

            it('should have empty http header values', function () {
                var dfd = this.async();
                getController({
                    success: function (myController) {
                        controller = myController;
                        expect(controller.getHttpHeaders().length).to.equal(0);
                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                });
            });

            it('should have empty http vary params', function () {
                var dfd = this.async();
                getController({
                    success: function (myController) {
                        controller = myController;
                        expect(controller.getHttpVaryParams().length).to.equal(0);
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