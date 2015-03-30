define(['jquery', 'underscore', 'l!jquerycookie'], function ($, _) {

    'use strict';

    if (LAZO.isClient) {
        // do not encode or decode cookie values
        $.cookie.raw = true;
    }

    function normalizeLocation(location, headers, info) {
        var keys = ['host', 'hostname', 'search', 'href', 'pathname', 'port', 'protocol'];
        var retVal = _.pick(location, keys);
        var host;

        if (headers && headers.host) {
            host = headers.host.split(':');
            retVal.host = headers.host;
            retVal.hostname = host[0];
            retVal.port = host[1];
        }

        if(info){
            retVal.protocol = info.protocol;
        }


        return retVal;
    }

    function Context(options) {
        var defaults = {
            _rootCtx: {
                modelList: {},
                modelInstances: {},
                data: options && options.data ? options.data : {},
                pageTitle: options && options.pageTitle ? options.pageTitle : LAZO.app.defaultTitle
            },
            assets: {},
            collections: {},
            models: {},
            params: {}
        };

        // Create a copy and fill in default values
        options = _.defaults(_.extend({}, options), defaults);

        this.assets = options.assets;
        this.collections = options.collections;
        this.models = options.models;
        this.params = options.params;
        this.meta = options.meta;
        this.headers = options.headers;

        // Root context
        this._rootCtx = options._rootCtx;

        if (LAZO.app.isServer && options._request) {
            // Do not serialize this!
            this._request = options._request;
            this._reply = options._reply;
            this.location = normalizeLocation(options._request.url, this.headers, options._request.server.info);
            this.userAgent = this.headers['user-agent'];
            this.isTunnelRequest = options.isTunnelRequest || false;
        } else if (LAZO.app.isClient) {
            this.location = normalizeLocation(window.location);
            this.userAgent = window.navigator.userAgent;
        }
    }

    Context.prototype = {
        setSharedData: function (key, val) {
            this._rootCtx.data[key] = val;
            return this;
        },

        getSharedData: function (key) {
            return this._rootCtx.data[key];
        },

        getCookie: function (name) {
            if (LAZO.app.isServer) {
                return this._request.state[name] ? this._request.state[name] : undefined;
            } else {
                return $.cookie(name);
            }
        },

        setCookie: function (name, value, options) {
            if (LAZO.app.isServer) {
                options.ttl = options.expires || null;
                this._reply.state(name, value, options);
            } else {
                $.cookie(name, value, options);
            }
        },

        clearCookie: function (name, options) {
            if (LAZO.app.isServer) {
                this._reply.state(name, null, _.extend({ ttl: 0, path: '/' }, options));
            } else {
                $.removeCookie(name, _.extend({ path: '/' }, options));
            }
        }

    };

    return Context;
});