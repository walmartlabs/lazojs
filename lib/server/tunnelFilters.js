define(['underscore'], function (_) {

    'use strict';

    var filters = [];

    function iterateRequest(syncher, method, model, params, options, filters, i) {
        if (filters[i]) {
            filters[i].onRequest.call(syncher, method, model, params, {
                success: function (method, modelOrArgs, params) {
                    i += 1;
                    iterateRequest(syncher, method, modelOrArgs, params, options, filters, i);
                },
                error: function (response) {
                    return options.error(response);
                }
            });
        } else {
            return options.success(method, model, params);
        }
    }

    function iterateResponse(syncher, responseMethod, model, response, options, filters, i) {
        if (filters[i]) {
            filters[i][responseMethod].call(syncher, model, response, {
                success: function (model, response) {
                    i += 1;
                    iterateResponse(syncher, responseMethod, model, response, options, filters, i);
                },
                error: function (model, response) {
                    return options.error(model, response); // Response error handler includes model and response args
                }
            });
        } else if (responseMethod === 'onError') {
            return options.error(model, response);
        }
        else {
            return options.success(model, response);
        }
    }

    var defaultTunnelFilter = {
        onRequest: function (method, modelOrArgs, params, options) {
            options.success(method, modelOrArgs, params);
        },

        onSuccess: function (model, response, options) {
            options.success(model, response);
        },

        onError: function (model, response, options) {
            options.error(model, response);
        }
    };

    var tunnelFilters = {

        onRequest: function (syncher, method, model, params, options) {
            // iterate the tunnel filters
            iterateRequest(syncher, method, model, params, options, filters, 0);
        },

        onSuccess: function (syncher, model, response, options) {
            // iterate the tunnel filters
            iterateResponse(syncher, 'onSuccess', model, response, options, filters, 0);
        },

        onError: function (syncher, model, response, options) {
            // iterate the tunnel filters
            iterateResponse(syncher, 'onError', model, response, options, filters, 0);
        },

        add: function (tunnelFilter) {
            var filter = _.extend(_.clone(defaultTunnelFilter), tunnelFilter);
            filters.push(filter);
            return this;
        },

        getFilterOptions: function (sync, options) {
            return {
                success: function (model, response) {
                    tunnelFilters.onSuccess(sync, model, response, {
                        success: function (model, response) {
                            options.success(model, response);
                        },
                        error: function (model, response) {
                            options.error(model, response);
                        }
                    });
                },
                error: function (model, response) {
                    tunnelFilters.onError(sync, model, response, {
                        error: function (model, response) {
                            options.error(model, response);
                        }
                    });
                }
            };
        }



        //,createFilterOptions: function (sync, isSyncRequest, options) {
        //    return {
        //        success: function (model, response) {
        //            tunnelFilters.onSuccess(sync, model, response, {
        //                success: function (model, response) {
        //                    options.success(model, response);
        //                },
        //                error: function (model, response) {
        //                    options.error(model, response);
        //                }
        //            });
        //        },
        //        error: function (model, response) {
        //            tunnelFilters.onError(sync, model, response, {
        //                error: function (model, response) {
        //                    options.error(model, response);
        //                }
        //            });
        //        }
        //    };
        //}
    };

    return tunnelFilters;

});