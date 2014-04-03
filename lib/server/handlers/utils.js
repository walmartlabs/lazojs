define(['underscore'], function (_) {

    'use strict';

    return {

        getParams: function (request) {
            var params = {},
                reqParams,
                qryParams,
                key;

            if ((reqParams = _.extend(request.params, request.payload ? request.payload : {}))) {
                for (key in reqParams) {
                    params[key] = reqParams[key];
                }
            }
            if ((qryParams = request.query)) {
                for (key in qryParams) {
                    params[key] = qryParams[key];
                }
            }

            return params;
        },

        getCookies: function (request) {
            var cookies = {},
                state;
            if (!(state = request.state)) {
                return cookies;
            }

            for (var key in state) {
                cookies[key] = decodeURIComponent(state[key]);
            }

            return cookies;
        },

        getAssets: function (cmpName, ctx, options) {
            if (!_.isEmpty(ctx._assets)) {
                var map = ctx._assets;
                delete ctx._assets;
                return options.success(map);
            }

            if (LAZO.app.isClient) {
                return options.success(window.rootCtx ? window.rootCtx.assets : {});
            }

            LAZO.app.assets.map(cmpName, ctx, {
                success: options.success,
                error: options.error
            });
        },

        setAssets: function (component, assets) {
            var self = this;

            component.ctx.assets = component.ctx.assets || {};
            _.extend(component.ctx.assets, assets[component.name]);

            component.ctx.app = component.ctx.app || {};
            component.ctx.app.assets = component.ctx.app.assets || {};
            _.extend(component.ctx.app.assets, assets.app);

            _.each(component.children, function (children) {
                _.each(children, function (child) {
                    self.setAssets(child, assets);
                });
            });
        },

        getRootCtxForReply: function (ctx, assets) {
            return _.extend(_.omit(ctx._rootCtx, 'modelInstances'), {
                dependencies: ctx._rootCtx.dependencies,
                assets: assets,
                modelInstances: {}
            });
        },
        
        getHeaders: function (request) {
            return request.raw.req.headers;    
        },
        
        getParsedUrl: function (request) {
            return request.url;    
        }

    };

});