define([
    'intern!bdd',
    'intern/chai!',
    'intern/chai!expect',
    'sinon',
    'sinon-chai',
    'test/unit/utils',
    'tunnelFilters'
], function (bdd, chai, expect, sinon, sinonChai, utils, TunnelFilters) {
    chai.use(sinonChai);

    with (bdd) {
        describe('Tunnel Filters', function () {

            var log = [];
            var model = {};
            var params = {};
            var modifiedParams = { id: 1 };
            var modifiedResponse = { statusCode: 301 };
            var errorResponse = { statusCode: 500 };
            var tunnelFilter = {
                onRequest: function (method, modelOrArgs, params, options) {
                    log.push('onRequest');
                    if (method === 'failOnRequest') {
                        return options.error(errorResponse);
                    }

                    if (model.modifyOnRequest === true) {
                        return options.success(method, modelOrArgs, modifiedParams);
                    }

                    options.success(method, modelOrArgs, params);
                },

                onSuccess: function (model, response, options) {
                    log.push('onSuccess');
                    if (model.failOnSuccess === true) {
                        return options.error(model, response);
                    }

                    if (model.modifyOnSuccess === true) {
                        return options.success(model, modifiedResponse);
                    }

                    options.success(model, response);
                },

                onError: function (model, response, options) {
                    log.push('onError');
                    if (model.modifyOnError === true) {
                        return options.error(model, errorResponse);
                    }

                    options.error(model, response);
                }
            };

            before(function () {
                // add
                TunnelFilters.add(tunnelFilter);
            });

            beforeEach(function () {
                // reset vars
                log = [];
                model = {};
                params = {};
            });

            it('onRequest handler should prevent sync function when it returns error', function () {

                var dfd = this.async();
                var sync = {};
                var options = {
                    error: function (resp) {
                        expect(log).to.eql(['onRequest', 'onRequestFailed']);
                        expect(resp).to.equal(errorResponse);
                        dfd.resolve();
                    }
                };

                TunnelFilters.onRequest(sync, 'failOnRequest', model, params, {
                    isSyncRequest: true,
                    error: function (response) {
                        log.push('onRequestFailed');
                        return options.error(response);
                    }
                });

            });

            it('onError handler should return error', function () {

                var dfd = this.async();
                var sync = {};
                var response = {
                    statusCode: 200
                };
                var options = {
                    error: function (mdl, resp) {
                        expect(log).to.eql(['onRequest', 'onSync', 'onError']);
                        expect(mdl).to.equal(model);
                        expect(resp).to.equal(response);
                        dfd.resolve();
                    }
                };

                TunnelFilters.onRequest(sync, 'create', model, params, {
                    isSyncRequest: true,
                    success: function (method, modelOrArgs, params) {
                        log.push('onSync');

                        var opts = TunnelFilters.getFilterOptions(sync, options);
                        opts.error(modelOrArgs, response);
                    }
                });

            });

            it('onSuccess handler should return error', function () {

                var dfd = this.async();
                var sync = {};
                var response = {
                    statusCode: 200
                };
                var options = {
                    error: function (mdl, resp) {
                        expect(log).to.eql(['onRequest', 'onSync', 'onSuccess']);
                        expect(mdl).to.equal(model);
                        expect(resp).to.equal(response);
                        dfd.resolve();
                    }
                };

                model.failOnSuccess = true;
                TunnelFilters.onRequest(sync, 'create', model, params, {
                    isSyncRequest: true,
                    success: function (method, modelOrArgs, params) {
                        log.push('onSync');

                        var opts = TunnelFilters.getFilterOptions(sync, options);
                        opts.success(modelOrArgs, response);
                    }
                });

            });

            it('onRequest handler should modify request', function () {

                var dfd = this.async();
                var sync = {};
                var response = {
                    statusCode: 200
                };
                var options = {
                    success: function (mdl, resp) {
                        expect(log).to.eql(['onRequest', 'onSync', 'onSuccess']);
                        expect(mdl).to.equal(model);
                        expect(resp).to.equal(response);
                        dfd.resolve();
                    }
                };

                model.modifyOnRequest = true;
                TunnelFilters.onRequest(sync, 'create', model, params, {
                    isSyncRequest: true,
                    success: function (method, modelOrArgs, params) {

                        expect(params).to.equal(modifiedParams);

                        log.push('onSync');
                        var opts = TunnelFilters.getFilterOptions(sync, options);
                        opts.success(modelOrArgs, response);
                    }
                });

            });

            it('onSuccess handler should modify response', function () {

                var dfd = this.async();
                var sync = {};
                var response = {
                    statusCode: 200
                };
                var options = {
                    success: function (mdl, resp) {
                        expect(log).to.eql(['onRequest', 'onSync', 'onSuccess']);
                        expect(mdl).to.equal(model);
                        expect(resp).to.equal(modifiedResponse);
                        dfd.resolve();
                    }
                };

                model.modifyOnSuccess = true;
                TunnelFilters.onRequest(sync, 'create', model, params, {
                    isSyncRequest: true,
                    success: function (method, modelOrArgs, params) {

                        log.push('onSync');

                        var opts = TunnelFilters.getFilterOptions(sync, options);
                        opts.success(modelOrArgs, response);
                    }
                });


            });

            it('onError handler should modify error', function () {

                var dfd = this.async();
                var sync = {};
                var response = {
                    statusCode: 200
                };
                var options = {
                    error: function (mdl, resp) {
                        expect(log).to.eql(['onRequest', 'onSync', 'onError']);
                        expect(mdl).to.equal(model);
                        expect(resp).to.equal(errorResponse);
                        dfd.resolve();
                    }
                };

                model.modifyOnError = true;
                TunnelFilters.onRequest(sync, 'create', model, params, {
                    isSyncRequest: true,
                    success: function (method, modelOrArgs, params) {

                        log.push('onSync');

                        var opts = TunnelFilters.getFilterOptions(sync, options); // TODO: Should this accept the inner success/error fn's?
                        // TODO: Should a filter that errors onRequest, then jump to then iterate the 'onError' handlers of filters?
                        opts.error(modelOrArgs, response);
                    }
                });

                //// TODO: Commit before making this change
                //var isSyncReq = true;
                //TunnelFilters.createFilterOptions(sync, isSyncReq, {
                //    success: function (method, modelOrArgs, params, opts) {}, // adding extra opts allows for better control, and enables filteres to run on ALL errors
                //    error: function (model, response, opts) {} // adding extra opts allows for better control, and enables filteres to run on ALL errors
                //    // TODO: Prob don't need an error handler here, if the onRequest fails, then process will exit via filters
                //});

            });

            it('should return original success response', function () {

                var dfd = this.async();
                var sync = {};
                var response = {
                    statusCode: 200
                };
                var options = {
                    success: function (mdl, resp) {
                        expect(log).to.eql(['onRequest', 'onSync', 'onSuccess']);
                        expect(mdl).to.equal(model);
                        expect(resp).to.equal(response);
                        dfd.resolve();
                    },
                    error: function () {
                        dfd.reject();
                    }
                };

                TunnelFilters.onRequest(sync, 'create', model, params, {
                    isSyncRequest: true,
                    success: function (method, modelOrArgs, params) {

                        log.push('onSync');

                        var opts = TunnelFilters.getFilterOptions(sync, options);
                        opts.success(modelOrArgs, response);
                    },
                    error: function (response) {
                        return options.error(response);
                    }
                });

            });

            it('should return original error response', function () {

                var dfd = this.async();
                var sync = {};
                var response = {
                    statusCode: 500
                };
                var options = {
                    error: function (mdl, resp) {
                        expect(log).to.eql(['onRequest', 'onSync', 'onError']);
                        expect(mdl).to.equal(model);
                        expect(resp).to.equal(response);
                        dfd.resolve();
                    }
                };

                TunnelFilters.onRequest(sync, 'create', model, params, {
                    isSyncRequest: true,
                    success: function (method, modelOrArgs, params) {

                        log.push('onSync');

                        var opts = TunnelFilters.getFilterOptions(sync, options);
                        opts.error(modelOrArgs, response);
                    }
                });

            });

        });
    }
});