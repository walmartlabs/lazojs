define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'lib/server/handlers/tunnel',
    'lazoModel',
    'underscore'
], function (bdd, chai, expect, sinon, sinonChai, utils, Tunnel, LazoModel, _) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Tunnel Handler', function () {

            var requestBase = {
                params: {

                },
                raw: {
                    req: {
                        headers: {

                        }
                    }
                },
                url: {

                },
                server: {
                    // info: {}
                }
            };

            it('should provide request context when fetching models', function () {

                var dfd = this.async();

                var req = _.extend(requestBase, {
                    payload: {
                        method: 'GET',
                        model: 'modelName'
                    }
                });

                LAZO.app.loadModel = function (fname, opts) {
                    opts.success({
                        ctx: {
                            getHttpStatusCode: function () {},
                            getHttpHeaders: function () {},
                            getHttpVaryParams: function () {}
                        },
                        _getGlobalId: function () {},
                        toJSON: function () {}
                    });
                };

                var lazoSpy = sinon.spy(LAZO.app, 'loadModel');
                var reply = function () {

                    var opts = lazoSpy.getCall(0).args[1]; // LAZO.app.loadModel.getCall(0).args[1];
                    expect(opts.ctx).to.exist;
                    expect(opts.ctx._request).to.exist;
                    expect(opts.ctx._reply).to.exist;

                    lazoSpy.restore();
                    dfd.resolve();

                };

                Tunnel(req, reply);

            });

            it('should provide request context when deleting models', function () {

                var dfd = this.async();

                var req = _.extend(requestBase, {
                    payload: {
                        method: 'DELETE',
                        model: 'modelName',
                        attributes: {},
                        params: {}
                    }
                });

                LAZO.files.appViews = LAZO.files.appViews || {};
                LAZO.files.models = LAZO.files.models || {};
                LAZO.files.models['models/modelName/model.js'] = true;

                var stub = sinon.stub(LazoModel.prototype, 'destroy', function (opts) {
                            opts.success({
                                ctx: {
                                    getHttpStatusCode: function () {},
                                    getHttpHeaders: function () {},
                                    getHttpVaryParams: function () {}
                                },
                                _getGlobalId: function () {},
                                toJSON: function () {}
                            });
                        });

                LAZO.require = function (path, success, error) {

                    return success(LazoModel);

                };

                var reply = function () {

                    var modelInstance = stub.thisValues[0];
                    expect(modelInstance.ctx).to.exist;
                    expect(modelInstance.ctx._request).to.exist;
                    expect(modelInstance.ctx._reply).to.exist;

                    stub.restore();
                    dfd.resolve();

                };

                Tunnel(req, reply);

            });

            it('should provide request context when saving models', function () {

                var dfd = this.async();

                var req = _.extend(requestBase, {
                    payload: {
                        method: 'POST',
                        model: 'modelName',
                        attributes: {},
                        params: {}
                    }
                });

                LAZO.files.appViews = LAZO.files.appViews || {};
                LAZO.files.models = LAZO.files.models || {};
                LAZO.files.models['models/modelName/model.js'] = true;

                var stub = sinon.stub(LazoModel.prototype, 'save', function (args, opts) {
                    opts.success({
                        ctx: {
                            getHttpStatusCode: function () {},
                            getHttpHeaders: function () {},
                            getHttpVaryParams: function () {}
                        },
                        _getGlobalId: function () {},
                        toJSON: function () {}
                    });
                });

                LAZO.require = function (path, success, error) {

                    return success(LazoModel);

                };

                var reply = function () {

                    var modelInstance = stub.thisValues[0];
                    expect(modelInstance.ctx).to.exist;
                    expect(modelInstance.ctx._request).to.exist;
                    expect(modelInstance.ctx._reply).to.exist;

                    stub.restore();
                    dfd.resolve();

                };

                Tunnel(req, reply);

            });

            it('should provide request context to NON-CRUD model actions', function () {

                var dfd = this.async();

                var req = _.extend(requestBase, {
                    payload: {
                        method: 'NONCRUD',
                        fname: 'alternative',
                        model: 'modelName',
                        args: {},
                        attributes: {},
                        params: {}
                    }
                });

                LAZO.files.appViews = LAZO.files.appViews || {};
                LAZO.files.models = LAZO.files.models || {};
                LAZO.files.models['models/modelName/model.js'] = true;

                var stub = sinon.stub(LazoModel.prototype, 'call', function (fname, args, opts) {
                    opts.success({
                        _getGlobalId: function () {},
                        toJSON: function () {}
                    });
                });

                LAZO.require = function (path, success, error) {

                    return success(LazoModel);

                };

                var reply = function () {

                    var modelInstance = stub.thisValues[0];
                    expect(modelInstance.ctx).to.exist;
                    expect(modelInstance.ctx._request).to.exist;
                    expect(modelInstance.ctx._reply).to.exist;

                    stub.restore();
                    dfd.resolve();

                    return {
                        code: function () {},
                        header: function () {},
                        vary: function () {}
                    };
                };

                Tunnel(req, reply);

            });

        });
    }
});