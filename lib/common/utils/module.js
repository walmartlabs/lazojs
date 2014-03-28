define(['resolver/file', 'underscore', 'text', 'lazoView', 'context', 'utils/loader', 'lazoCollectionView', 'async'],
    function (file, _, text, LazoView, Context, loader, LazoCollectionView, async) {

    'use strict';

    return {

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

        addItemEmptyViews: function (view, callback) {
            var self = this,
                names = [],
                viewsRequiredCount,
                viewsLoadedCount = 0,
                i;

            function concat(arr, val) {
                return arr.concat(_.isArray(val) ? val : [val]);
            }

            function onViewLoad() {
                viewsLoadedCount++;
                if (viewsLoadedCount === viewsRequiredCount) {
                    return callback(null, view);
                }
            }

            // get view names
            if (view.itemView) {
                names = concat(names, view.itemView);
            }
            if (view.emptyView) {
                names = concat(names, view.emptyView);
            }

            if (_.size(view.views)) {
                _.each(view.views, function (viewSet) {
                    if (viewSet.itemView) {
                        names = concat(names, viewSet.itemView);
                    }
                    if (viewSet.emptyView) {
                        names = concat(names, viewSet.emptyView);
                    }
                });
            }

            // create view loader tasks
            view._itemEmptyViewConstructors = {};
            names = _.uniq(names);
            i = names.length;
            viewsRequiredCount = i;

            if (!viewsRequiredCount) {
                return callback(null, view);
            }

            while (i) {
                i--;
                (function (i) {
                    var viewPath = file.getPath(names[i], view.ctl.name, 'view');
                    LAZO.require([viewPath], function (ItemEmptyView) {
                        self.addPath(viewPath, view.ctl.ctx);
                        view._itemEmptyViewConstructors[names[i]] = ItemEmptyView;
                        onViewLoad();
                    },
                    function (err) {
                        view._itemEmptyViewConstructors[names[i]] = LazoView;
                        onViewLoad();
                    });
                })(i);
            }
        },

        addItemEmptyTemplatesPaths: function (view, ctx, callback) {
            if (!(view instanceof LazoCollectionView) || !view._itemEmptyViewConstructors) {
                return callback(null, view);
            }

            var self = this,
                tasks = [],
                templatePath,
                itemEmptyViews = view.getItemEmptyViews();

            view._itemEmptyViewTemplates = {};
            for (var i = 0; i < itemEmptyViews.length; i++) {
                templatePath = file.getTemplatePath(itemEmptyViews[i]);
                view._itemEmptyViewTemplates[file.getTemplateName(itemEmptyViews[i])] = {
                    template: null,
                    path: templatePath
                };

                self.addPath('text!' + templatePath, ctx);
            }

            callback(null, view);
        },

        addItemEmptyTemplates: function (view, callback) { // TODO: return a hash with paths as the key for compiling and writing
            var views = view.getItemEmptyViews(),
                templatesRequiredCount = views.length,
                templatesLoadedCount = 0,
                i = templatesRequiredCount,
                self = this;

            function onTemplateLoad() {
                templatesLoadedCount++;
                if (templatesLoadedCount === templatesRequiredCount) {
                    return callback(null, view);
                }
            }

            view._itemEmptyViewTemplates = {};

            while (i) {
                i--;
                (function (i) {
                    views[i].templatePath = file.getTemplatePath(views[i]);

                    LAZO.require(['text!' + views[i].templatePath], function (template) {
                        views[i].template = template;
                        view._itemEmptyViewTemplates[file.getTemplateName(views[i])] = {
                            template: template,
                            path: views[i].templatePath
                        };
                        self.addPath('text!' + views[i].templatePath, view.ctl.ctx);
                        onTemplateLoad();
                    },
                    function (err) {
                        views[i].template = '';
                        view._itemEmptyViewTemplates[file.getTemplateName(views[i])] = {
                            template: '',
                            path: null
                        };
                        onTemplateLoad();
                    });
                })(i);
            }
        },

        addViewWidgets: function (view, ctx, callback) {
            var self = this,
                tasks = [];

            this.addLoadWidgetFuncs(view, ctx, tasks);

            if (view instanceof LazoCollectionView) {
                var views = view.getItemEmptyViews();
                for (var i = 0, il = views.length; i < il; i++) {
                    var v = views[i];
                    this.addLoadWidgetFuncs(v, ctx, tasks);
                }
            }

            if (tasks.length) {
                async.parallel(tasks, function (error, result) {
                    if (error) {
                        return callback(error);
                    }

                    callback(null, view);
                });
            }
            else {
                callback(null, view);
            }
        },

        addLoadWidgetFuncs: function (view, ctx, tasks) {
            var self = this;
            _.each(view.widgets, function (value, key) {
                tasks.push(function (asyncCb) {
                    self._loadWidget(view.widgets[key], ctx, {
                        success: function (Widget) {
                            view[key] = Widget;
                            asyncCb();
                        },
                        error: function (err) {
                            asyncCb(err, null);
                        }
                    });
                });
            });
        },

        _loadWidget: function (widget, ctx, options) {
            var self = this,
                rootCtx = ctx._rootCtx,
                errBack = function (err) {
                    if (options.error) {
                        options.error(err);
                    }
                    else {
                        options.success();
                    }
                };

            if (!options.success) {
                var err = new Error('loadWidget: No success function passed in options');
                if (options.error) {
                    options.error(err);
                }
                else {
                    throw err;
                }
            }
            LAZO.require([widget],
                function (widgetDef) {
                    var widgetCss;

                    if (!rootCtx.dependencies) {
                        rootCtx.dependencies = {
                            css: [],
                            js: []
                        };
                    }

                    if (widgetDef.css) {
                        widgetCss = _.isArray(widgetDef.css) ? widgetDef.css : [widgetDef.css];
                        ctx.css = widgetCss.concat(ctx.css);
                        rootCtx.dependencies.css = _.uniq(widgetCss.concat(rootCtx.dependencies.css));
                    }

                    if (LAZO.app.isServer) {
                        self.addPath(widget, ctx);
                        self.addPath(widgetDef.js, ctx);
                        options.success();
                    }
                    else {
                        LAZO.require([widgetDef.js],
                            function (Widget) {
                                options.success(Widget);
                            },
                            errBack
                        );
                    }
                },
                errBack
            );
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
            childContext = _.extend({}, parent.ctx, new Context(options), options.ctx);

            if (parent.ctx && parent.ctx._rootCtx) {
                childContext._rootCtx = parent.ctx._rootCtx;
            }

            childOptions.ctx = childContext;
            loader(cmpName, _.extend({}, childOptions, {
                success: onComponentLoad, error: onError
            }));
        }

    };

});