define(['resolver/file', 'underscore', 'text', 'context', 'utils/loader', 'async', 'utils/assetsMixin'],
    function (file, _, text, Context, loader, async, assetsMixin) {

    'use strict';

    return _.extend({

        addPath: function (path, ctx) {
            var modules;
            if (LAZO.app.isServer) {
                modules = ctx._rootCtx.modules = ctx._rootCtx.modules || [];
                modules.push(path);
                ctx.js = ctx.js || [];
                ctx.js.push(path);
            }

            return this;
        },

        getView: function (path, callback) {
            LAZO.require([path], function (View) {
                return callback(null, View);
            }, function (err) { // TODO: error handling
                return callback(new Error('module.getView failed for ' + path + ' : ' + err.message), null);
            });
        },

        getTemplate: function (templatePath, callback) {
            LAZO.require(['text!' + templatePath], function (template) {
                return callback(null, template);
            }, function (err) { // TODO: error handling
                return callback(new Error('Controller _getTemplate failed for ' + templatePath + ' : ' + err.message), null);
            });
        },

        addChild: function (container, cmpName, parent, options) {
            var childOptions,
                childContext,
                defaults = {
                    action: 'index'
                };

            function onError(error) {
                _.delay(options.error, 0, error);
            }

            function onComponentLoad(child) {
                if (!parent.children) {
                    parent.children = {};
                }

                if (!parent.children[container]) {
                    parent.children[container] = [];
                }

                parent.children[container].push(child);

                _.delay(options.success, 0, child);
            }

            options = _.defaults(options || {}, {
                error: function () {
                    return;
                },
                success: function () {
                    return;
                }
            });

            if (typeof container !== 'string' || !container) {
                return onError(new TypeError()); // TODO: error handling
            }

            if (typeof cmpName !== 'string' || !cmpName) {
                return onError(new TypeError()); // TODO: error handling
            }

            childOptions = _.defaults(_.pick(options, 'action', 'rootComponent'), defaults);
            childContext = new Context(_.extend({}, _.pick(parent.ctx, ['_rootCtx', '_request', '_reply', 'headers', 'meta']), {
                params : options.params }));

            if (parent.ctx && parent.ctx._rootCtx) {
                childContext._rootCtx = parent.ctx._rootCtx;
            }

            this.getAssets(cmpName, childContext, {
                success: function (assets) {
                    childContext.assets = assets;
                    childOptions.ctx = childContext;
                    loader(cmpName, _.extend({}, childOptions, {
                        success: onComponentLoad, error: onError
                    }));
                },
                error: onError
            });
        }

    }, assetsMixin);

});