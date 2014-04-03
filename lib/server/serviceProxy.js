define(['base', 'request', 'underscore', 'resolver/model'], function (Base, request, _, helpers) {

    /**
     * A utility class that can be used to call service endpoints.
     * @class ServiceProxy
     */
    var ServiceProxy = Base.extend({

        /**
         * Constructor used internally.
         * @constructor
         * @private
         */
        constructor: function (ctx) {
            this.ctx = ctx;
        },

        /**
         * Use to send a GET request to a service
         * @method get
         * @param {String} svc The url for a given service endpoint
         * @param {Object} options
         *      @param {Object} [options.params] A hash containing name-value pairs used in url substitution.
         *      @param {Function} options.success Callback function to be called when fetch succeeds, passed <code>(response)</code> as argument.
         *      @param {Function} options.error Callback function to be called when fetch fails, passed <code>(response)</code> as argument.
         *      @param {Object} [options.headers] A hash containing name-value pairs of headers to be sent to the service.
         *      @param {Boolean} [options.raw] A boolean that if set to true will return a unparsed response.
         * @async
         */
        get: function (svc, options) {
            options = options || {};
            options.raw = !!options.raw;

            if (!options.success) {
                throw new Error('Success callback undefined for service call svc: ' + svc);
            }

            var error = options.error;
            options.error = function (err) {
                if (error) {
                    error(err);
                }
            };
            // use the backbone verbs
            this.sync(
                'read',
                {
                    name: svc,
                    url: svc,
                    params: options.params,
                    ctx: this.ctx
                },
                options);
        },

        /**
         * Used to send a POST request to a service
         * @method post
         * @param {String} svc The url for a given service endpoint
         * @param {Object} attributes A hash containing name-value pairs used to be sent as the payload to the server
         * @param {Object} options
         *      @param {Object} [options.params] A hash containing name-value pairs used in url substitution.
         *      @param {Function} options.success Callback function to be called when fetch succeeds, passed <code>(response)</code> as argument.
         *      @param {Function} options.error Callback function to be called when fetch fails, passed <code>(response)</code> as argument.
         * @async
         */
        post: function (svc, attributes, options) {
            options = options || {};
            if (!options.success) {
                throw new Error('Success callback undefined for service call svc: ' + svc);
            }

            var error = options.error;
            options.error = function (err) {
                if (error) {
                    error(err);
                }
            };
            // use the backbone verbs
            this.sync(
                'create',
                {
                    name: svc,
                    url: svc,
                    params: options.params,
                    ctx: this.ctx,
                    toJSON: function () {
                        return attributes;
                    }
                },
                options);
        },

        /**
         * Used to send a PUT request to a service
         * @method put
         * @param {String} svc The url for a given service endpoint
         * @param {Object} attributes A hash containing name-value pairs used to be sent as the payload to the server
         * @param {Object} options
         *      @param {Object} [options.params] A hash containing name-value pairs used in url substitution.
         *      @param {Function} options.success Callback function to be called when fetch succeeds, passed <code>(response)</code> as argument.
         *      @param {Function} options.error Callback function to be called when fetch fails, passed <code>(response)</code> as argument.
         * @async
         */
        put: function (svc, attributes, options) {
            options = options || {};
            if (!options.success) {
                throw new Error('Success callback undefined for service call svc: ' + svc);
            }

            var error = options.error;
            options.error = function (err) {
                if (error) {
                    error(err);
                }
            };
            // use the backbone verbs
            this.sync(
                'update',
                {
                    name: svc,
                    url: svc,
                    params: options.params,
                    ctx: this.ctx,
                    toJSON: function () {
                        return attributes;
                    }
                },
                options);
        },

        /**
         * Used to send a DELETE request to a service
         * @method destroy
         * @param {String} svc The url for a given service endpoint
         * @param {Object} attributes A hash containing name-value pairs used to be sent as the payload to the server
         * @param {Object} options
         *      @param {Object} [options.params] A hash containing name-value pairs used in url substitution.
         *      @param {Function} options.success Callback function to be called when fetch succeeds, passed <code>(response)</code> as argument.
         *      @param {Function} options.error Callback function to be called when fetch fails, passed <code>(response)</code> as argument.
         * @async
         */
        destroy: function (svc, attributes, options) {
            options = options || {};
            if (!options.success) {
                throw new Error('Success callback undefined for service call svc: ' + svc);
            }

            var error = options.error;
            options.error = function (err) {
                if (error) {
                    error(err);
                }
            };
            // use the backbone verbs
            this.sync(
                'delete',
                {
                    name: svc,
                    url: svc,
                    params: options.params,
                    ctx: this.ctx
                },
                options);
        },

        sync: function (method, model, options) {
            options = _(options).clone();
            method = helpers.methodMap[method]; // convert backbone verbs to http

            LAZO.logger.debug(['server.serviceProxy.sync'], 'Begin %s request', method, model.url);

            var errorWrapper = function (err, requestOptions, response, body) {
                LAZO.logger.error(['server.serviceProxy.sync'], '%s request failed', method, requestOptions.uri, err);

                var resp = {
                    statusCode: (response && response.statusCode ? response.statusCode : 500),
                    headers: (response && response.headers ? response.headers : {}),
                    body: body
                };

                response = response || {};

                if (err instanceof Error) {
                    resp.error = err.message;
                }
                else {
                    resp.error = err;
                }

                options.error(resp);
            };

            try {
                if (model._default) {
                    throw new Error('No model defined in repo for ' + model.name);
                }

                // throw error if no url
                if (!model.urlRoot && !model.url) {
                    throw new Error('Error: ServiceProxy failed.  No url or urlRoot for ' + model.name + ' type: ' + method);
                }

                // setup options for request call
                var requestOptions = {
                    method: method,
                    headers: options.headers ? options.headers : {},
                    timeout: options.timeout || 30000
                };

                if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                    requestOptions.body = model.toJSON(options);
                }

                requestOptions.uri = helpers.substitute(_.result(model, 'url'), model.params);

                // make the request
                request(requestOptions,
                    function (error, response, body) {
                        if (error) {
                            return errorWrapper(error, requestOptions, response, body);
                        }
                        else if (response && (response.statusCode && response.statusCode >= 200 && response.statusCode < 300 || response.statusCode === 304)) {
                            LAZO.logger.debug(['server.serviceProxy.sync'], '%s request succeed', method, model.url);

                            var data = body || '';

                            if (!options.raw) {
                                data = JSON.parse(body);
                            }

                            if (response.headers) {
                                model.responseHeaders = response.headers;
                            }

                            if (options.success) {
                                return options.success(data);
                            }
                        }
                        else {
                            return errorWrapper(new Error(response.statusCode), requestOptions, response, body);
                        }

                    }
                );

            } catch (e) {
                errorWrapper(e, requestOptions, {}, '');
            }
        }

    });

    return ServiceProxy;
});
