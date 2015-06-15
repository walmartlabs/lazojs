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
            return options.error(model, response); // TODO: How to break out of error handlers?
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

    function _onSuccess (syncher, model, response, options) {
        // iterate the tunnel filters
        iterateResponse(syncher, 'onSuccess', model, response, options, filters, 0);
    }

    function _onError (syncher, model, response, options) {
        // iterate the tunnel filters
        iterateResponse(syncher, 'onError', model, response, options, filters, 0);
    }

    function _getFilterOptions (sync, options) {
        return {
            success: function (model, response) {
                _onSuccess(sync, model, response, {
                    success: function (model, response) {
                        options.success(model, response);
                    },
                    error: function (model, response) {
                        options.error(model, response);
                    }
                });
            },
            error: function (model, response) {
                _onError(sync, model, response, {
                    error: function (model, response) {
                        options.error(model, response);
                    }
                });
            }
        };
    }

    return {

        onRequest: function (syncher, method, model, params, options, filterOptions) {
            var opts = {
                isSyncRequest: filterOptions.isSyncRequest || false,
                success: function (method, model, params) {
                    // execute the options.success handler, with custom options
                    filterOptions.success(method, model, params, _getFilterOptions(syncher, options));
                },
                error: function (response) {
                    // iterate all filters for error handlers
                    _onError(syncher, model, response, options);
                }
            };

            // iterate the tunnel filters
            iterateRequest(syncher, method, model, params, opts, filters, 0);
        },

        add: function (tunnelFilter) {
            var filter = _.extend(_.clone(defaultTunnelFilter), tunnelFilter);
            filters.push(filter);
            return this;
        }
    };

    // return tunnelFilters;

});