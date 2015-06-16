define(['commonContext', 'underscore'], function (Context, _) {

    'use strict';

    var ServerContext = Context.extend({

        constructor: function (options) {
            Context.prototype.constructor.call(this, options);

            // Do not serialize this!
            this._request = options._request;
            this._reply = options._reply;
            this.location = Context.normalizeLocation(options._request.url, this.headers, options._request.server.info);
            this.userAgent = this.headers['user-agent'];
            this.isTunnelRequest = options.isTunnelRequest || false;
            this.response = options.response;
        },

        getCookie: function (name) {
            return this._request.state[name] ? this._request.state[name] : undefined;
        },

        setCookie: function (name, value, options) {
            options.ttl = options.expires || null;
            this._reply.state(name, value, options);
        },

        clearCookie: function (name, options) {
            this._reply.state(name, null, _.extend({ ttl: 0, path: '/' }, options));
        },

        setHttpStatusCode: function (statusCode) {
            if (!_.isFinite(statusCode) || statusCode < 0) {
                throw new Error('statusCode is invalid, it must be a positive integer.');
            }

            this.response.statusCode = statusCode;
        },

        getHttpStatusCode: function (statusCode) {
            return this.response.statusCode || statusCode || 200;
        },

        addHttpHeader: function (name, value, options) {
            this.response.httpHeaders.push({ name: name, value: value, options: options || null });
        },

        getHttpHeaders: function () {
            return this.response.httpHeaders || [];
        },

        addHttpVaryParam: function (varyParam) {
            this.response.varyParams.push(varyParam);
        },

        getHttpVaryParams: function () {
            return this.response.varyParams || [];
        }

    });

    return ServerContext;

});