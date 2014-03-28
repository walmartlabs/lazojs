define(['jquery', 'underscore'], function ($, _) {

    'use strict';

    var Context = function (options) {
        var defaults = {
            _rootCtx: {
                modelList: {},
                modelInstances: {},
                cookies: options ? options.cookies : {},
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
        this.params = _.omit(options.params, '_lazo');
        this.meta = options.meta;
        this.headers = options.headers;
        
        // Root context
        this._rootCtx = options._rootCtx;

        this._rootCtx.exclude = options.params.exclude;

        if (LAZO.app.isServer && options._rawReq) {
            // Do not serialize this!
            this._rawReq = options._rawReq;
            this.isXHR = options._rawReq.raw.req.headers['x-requested-with'] === 'XMLHttpRequest' ? true : false;
            this.location = options._rawReq.url;
        } else if (LAZO.app.isClient) {
            this.location = window.location;
        }
    };

    Context.prototype = {
        setSharedData: function (key, val) {
            this._rootCtx.data[key] = val;
            return this;
        },

        getSharedData: function (key) {
            return this._rootCtx.data[key];
        },

        getCookie: function (name) {
            return this._rootCtx.cookies[name];
        },
        
        setCookie: function (name, value, options) {
            if (LAZO.app.isServer) {
                this._rawReq.setState(name, value, options);
                this._rootCtx.cookies[name] = value;
            } else {
                $.cookie(name, value);
                this._rootCtx.cookies[name] = value;
            }
        },

        clearCookie: function (name) {
            if (LAZO.app.isServer) {
                this._rawReq.clearState(name);
                this._rootCtx.cookies[name] = null;
                delete this._rootCtx.cookies[name];
            } else {
                $.removeCookie(name, value);
                this._rootCtx.cookies[name] = null;
                delete this._rootCtx.cookies[name];
            }
        }

    };
    
    // this is used for ctl.navigate
    Context.mergeRoot = function (receiver, giver) {
        for (var key in giver) {
            switch (key) {
                case 'dependencies':
                    break;
                case 'cookies':
                case 'data':
                    _.extend(receiver[key], giver[key]);
                    break;
                case 'modelList':
                case 'modelInstances':
                    for (var j in giver[key]) {
                        if (!receiver[key][j]) {
                            receiver[key][j] = giver[key][j];
                        }
                    }
                    break;
                case 'modules':
                    receiver[key] = receiver[key].concat(giver[key]);
                    receiver[key] = _.uniq(receiver[key]);
                    break;
                default:
                    receiver[key] = giver[key];
                    break;
            }
        }
    };

    Context.mergeGlobalModels = function (newCtx, oldCtx) {
        for (var k in oldCtx.modelList) {
            if (newCtx.modelList[k]) {
                newCtx.modelInstances[k] = oldCtx.modelInstances[k];
            }
        }
    };

    return Context;
});
