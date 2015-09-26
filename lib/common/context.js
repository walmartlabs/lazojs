define(['base', 'underscore'], function (Base, _) {

    'use strict';

    var Context = Base.extend({

        constructor: function(options) {
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
                params: {},
                meta: {},
                headers: {}
            };

            // Create a copy and fill in default values
            options = _.defaults(_.extend({}, options), defaults);

            this.assets = options.assets;
            this.collections = options.collections;
            this.models = options.models;
            this.params = _.extend({}, options.params);
            this.meta = options.meta;
            this.headers = options.headers;

            // Root context
            this._rootCtx = options._rootCtx;
        },

        setSharedData: function (key, val) {
            this._rootCtx.data[key] = val;
            return this;
        },

        getSharedData: function (key) {
            return this._rootCtx.data[key];
        }

    }, {
        // static props

        normalizeLocation: function (location, headers, info) {
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
    });

    return Context;

});