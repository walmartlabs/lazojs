define([
    'underscore',
    'backbone',
    'base',
    'resolver/main',
    'utils/module',
    'lazoCollectionView',
    'lazoView',
    'utils/ctlSerializor',
    'context',
    'async',
    'utils/template',
    'l!viewManager',
    'utils/prune',
    'bundler',
    'jquery',
    'l!jquerycookie'],
    function (
        _,
        Backbone,
        Base,
        resolver,
        module,
        LazoCollectionView,
        LazoBaseView,
        serializor,
        Context,
        async,
        template,
        viewManager,
        prune,
        Bundler,
        $) {

    'use strict';

    var bundle = new Bundler();

    var Controller = Base.extend(_.extend({

        constructor: function (options) {
            if (!options) {
                throw new TypeError('The options parameter is mandatory.'); // TODO: error handling
            }

            if (!options.name || typeof options.name !== 'string') {
                throw new TypeError('The options.name parameter is mandatory.'); // TODO: error handling
            }

            this.cid = _.uniqueId(options.name);
            this.ctx = options.ctx;
            this.name = options.name;
        },

        orderedCss: [],

        addChild: function (container, cmpName, options) {
            module.addChild(container, cmpName, this, options);
        },

        index: function (options) {
            return options.success('index');
        },

        navigate: function (action, options) {
            var self = this;
            options = options || {};

            options = _.defaults(options || {}, { error: function () {
                return;
            }, success: function () {
                return;
            }});

            // create a new context on navigation;
            // inherit all previous properties that
            // will not change and are not created by the
            // context
            this.ctx = new Context({
                _rootCtx: this.ctx._rootCtx,
                params: this.ctx.params,
                assets: this.ctx.assets,
                css: this.ctx.css,
                headers: this.ctx.headers,
                meta: this.ctx.meta,
            });

            this._execute(action, {
                error: function (err) {
                    return options.error(err);
                },
                success: function () {
                    setTimeout(function () {
                        viewManager.attachViews(self);
                        return options.success();
                    }, 0);
                }
            });
        },

        transition: function (prevCtx, view, options) { // TODO: add hook points for animation
            if (LAZO.app.isClient && this.currentView) {
                viewManager.cleanup(this, this.currentView.cid);
            }

            this.currentView = view;
            if (LAZO.app.isClient) {
                $('[lazo-cmp-id="' + this.cid + '"]').html(view.getHtml());
            }
            options.success(this);
        },

        setCookie: function (name, value, options) {
            this.ctx.setCookie(name, value, options);
        },

        clearCookie: function (name, options) {
            this.ctx.clearCookie(name, options);
        },

        loadModel: function (modelName, options) {
            LAZO.app.loadModel(modelName, _.extend(options, { ctx: this.ctx }));
        },

        loadCollection: function (collectionName, options) {
            LAZO.app.loadCollection(collectionName, _.extend(options, { ctx: this.ctx }));
        },

        createModel: function (modelName, attributes, options) {
            LAZO.app.createModel(modelName, attributes, _.extend(options, { ctx: this.ctx }));
        },

        createCollection: function (collectionName, attributes, options) {
            LAZO.app.createCollection(collectionName, attributes, _.extend(options, { ctx: this.ctx }));
        },

        setSharedData: function (key, val) {
            this.ctx.setSharedData(key, val);
            return this;
        },

        getSharedData: function (key) {
            return this.ctx.getSharedData(key);
        },

        toJSON: function (rootCtx) {
            return serializor.serialize(this, rootCtx);
        },

        serialize: function () {
            return JSON.stringify(this.toJSON());
        },

        setPageTitle: function (title) {
            this.ctx._rootCtx.pageTitle = title;
            return this;
        },

        getPageTitle: function () {
            return this.ctx._rootCtx.pageTitle;
        },

        getPath: function () {
            var parent = this.parent;
            var path = [];
            var node = this;

            if (!parent) {
                return [{ name: this.name, container: null, position: 0 }];
            }

            function getPosition(node, parent) {
                var children = parent.children;

                for (var k in children) {
                    for (var i = 0; i < children[k].length; i++) {
                        if (children[k][i] === node) {
                            return { name: node.name, container: k, position: i };
                        }
                    }
                }
            }

            while (parent) {
                path.unshift(getPosition(node, parent));
                node = parent;
                parent = parent.parent;
            }


            path.unshift({ name: node.name, container: null, position: 0 });
            return path;
        },

        augmentImportLink: function (link) {
            return link;
        },

        augmentCssLink: function (link) {
            return link;
        },

        getImport: function (relativePath) {
            return bundle.resolveImport(relativePath, this.name);
        },

        _getEl: function () {
            if (LAZO.app.isClient) {
                return $('[lazo-cmp-id="' + this.cid + '"]');
            }
        },

        _execute: function (action, options) {
            var tasks = this._buildExecTaskList(action),
                self = this,
                ctx = {};

            async.waterfall(tasks, function (err, view) {
                if (err) {
                    options.error(err);
                } else {
                    self.transition(ctx, view, options);
                }
            });
        },

        _createView: function (View, options) {
            try {
                return new View(_.extend({
                    ref: resolver.getPath(options.name, this.name, 'view'),
                    basePath: resolver.getBasePath(options.name, this.name, 'view'),
                    ctl: this
                }, options));
            } catch (e) {
                throw e;
            }
        },

        _buildExecTaskList: function (action) {
            var tasks = [],
                self = this;

            tasks.push(function (callback) {
                callback(null, action);
            });
            tasks.push(_.bind(this._action, this));
            tasks.push(_.bind(this._getCss, this));
            tasks.push(_.bind(this._getImports, this));
            tasks.push(_.bind(this._getView, this));
            tasks.push(_.bind(this._resolveTemplateEngine, this));
            return this._buildStandardExecTaskList(tasks);
        },

        _buildStandardExecTaskList: function (tasks) {
            tasks.push(_.bind(this._getTemplate, this));
            tasks.push(_.bind(this._getItemEmptyViews, this));
            tasks.push(_.bind(this._getViewWidgets, this));
            tasks.push(_.bind(this._getItemEmptyTemplates, this));
            return tasks;
        },

        _action: function (action, callback) {
            if (typeof this[action] !== 'function') {
                return callback(new Error('The given action is not implemented.'));
            }

            try {
                var actionCalled = false;
                this[action]({
                    error: function (err) {
                        err = err || new Error('The component action failed and an error object was not passed');
                        actionCalled = true;
                        return callback(err, null);
                    },
                    success: function (viewName) {
                        actionCalled = true;
                        return callback(null, viewName);
                    }
                });
            } catch (error) {
                if (!actionCalled) {
                    callback(error);
                } else { // What can we do?  THe error was in the callback, so let's not call that again!
                    throw error;
                }
            }
        },

        _getViewWidgets: function (view, callback) {
            module.addViewWidgets(view, this.ctx, function (err) {
                if (err) { // TODO: error handling
                    return callback(err, null);
                }
                callback(null, view);
            });
        },

        _getCss: function (viewName, callback) {
            this._getLinks('css');
            callback(null, viewName);
        },

        _getImports: function (viewName, callback) {
            this._getLinks('imports');
            callback(null, viewName);
        },

        _getLinks: function (type) {
            var self = this;
            var rootCtx = this.ctx._rootCtx;
            var getMethod = type === 'imports' ? 'getComponentImports' : 'getComponentCss';
            var augmentMethod = type === 'imports' ? 'augmentImportLink' : 'augmentCssLink';
            var links = _.map(resolver[getMethod](self.name), function (link) {
                var augmentedLink = self[augmentMethod]({ href: '/' + link });
                augmentedLink['lazo-link-ctx'] = self.name;
                return augmentedLink;
            });

            rootCtx.dependencies = rootCtx.dependencies || {};
            rootCtx.dependencies[type] = rootCtx.dependencies[type] || [];
            this.ctx[type] = links; // this only used for adding widget css
            links = _.filter(links, function (link) {
                return !_.find(rootCtx.dependencies[type], function (l) {
                    return l.href === link.href;
                });
            });
            rootCtx.dependencies[type] = rootCtx.dependencies[type].concat(links);
        },

        _getView: function (viewName, callback) {
            var self = this,
                path = resolver.getPath(viewName, this.name, 'view');

            resolver.isBase(path, 'view', function (isBase) {
                if (isBase) {
                    return callback(null, self._createView(LazoBaseView, { name: viewName, isBase: true }));
                } else {
                    module.getView(path, function (err, View) {
                        if (err) {
                            return callback(new Error('Controller _getView failed for ' + path + ' : ' + err.message), null);
                        }
                        module.addPath(path, self.ctx);
                        return callback(null, self._createView(View, { name: viewName, isBase: false }));
                    });
                }
            });
        },

        _resolveTemplateEngine: function (view, callback) {
            var engineName = view.templateEngine;
            template.loadTemplateEngine({
                name: engineName,
                handler: template.engHandlerMaker(engineName),
                exp: null,
                extension: template.getDefaultExt(engineName)
            }, {
                success: function (engine) {
                    view._templateEngine = engine;
                    callback(null, view);
                }
            });
        },

       _getTemplate: function (view, callback) {
            view.templatePath = resolver.getTemplatePath(view);

            module.getTemplate(view.templatePath, function (err, template) {
                if (err) {
                    view.template = view._templateEngine.compile('', view.templatePath);
                    view.hasTemplate = false;
                    return callback(null, view);
                }

                view.hasTemplate = true;
                view.template = view._templateEngine.compile(template);
                return callback(null, view);
            });
        },

        _addTemplatePathToCtx: function (view, callback) {
            if (view instanceof LazoCollectionView) {
                return this._getTemplate(view, callback);
            }

            module.addPath('text!' + resolver.getTemplatePath(view), this.ctx);
            callback(null, view);
        },

        _getItemEmptyViews: function (view, callback) {
            if (!(view instanceof LazoCollectionView)) {
                return callback(null, view);
            }

            module.addItemEmptyViews(view, function (err) {
                if (err) {
                    return callback(err, view);
                }
                return callback(null, view);
            });
        },

        _getItemEmptyTemplates: function (view, callback) {
            var self = this;
            var views = view instanceof LazoCollectionView ? view.getItemEmptyViews() : [];
            var i = views.length;
            var templatesToBeCompiled = i;
            var templatesCompiled = 0;

            if (!(view instanceof LazoCollectionView) || !view._itemEmptyViewConstructors || !i) {
                return callback(null, view);
            }

            module.addItemEmptyTemplates(view, function (err) {
                if (err) {
                    return callback(err, view);
                }

                while (i) {
                    i--;
                    (function (i) {
                        var convertedTemplatePath;
                        try {
                            views[i].hasTemplate = views[i].template.length ? true : false;
                            if (views[i].hasTemplate) {
                                module.addPath('text!' + view.templatePath, self.ctx); // TODO: remove once template precompilation works
                            }
                            convertedTemplatePath = resolver.convertTemplatePath(views[i].templatePath);
                            templatesCompiled++;
                            views[i].template = views[i]._templateEngine.compile(views[i].template);
                            views[i].compiledTemplatePath = convertedTemplatePath;
                            if (templatesToBeCompiled === templatesCompiled) {
                                return callback(err, view);
                            }
                        } catch (e) {
                            return callback(e, view);
                        }
                    })(i);
                }
            });
        },

        _addItemEmptyTemplatePath: function (view, callback) {
            module.addItemEmptyTemplatesPaths(view, this.ctx, callback);
        },

        _getPath: function (moduleName, moduleType) { // used by collection view
            return resolver.getPath(moduleName, this.name, moduleType);
        },

        _getBasePath: function (moduleName, moduleType) { // used by collection view
            return resolver.getBasePath(moduleName, this.name, moduleType);
        }

    }, Backbone.Events),
    {

        create: function (cmpName, ctlOptions, options) {
            var ctlPath = 'components/' + cmpName + '/controller';

            function loadBase() {
                var instance = new Controller(ctlOptions);
                instance.isBase = true;
                return options.success(instance);
            }

            function loadCtl() {
                LAZO.require([ctlPath], function (Ctl) {
                    var instance = new Ctl(ctlOptions);

                    module.addPath(ctlPath, ctlOptions.ctx);
                    // Initialize default params, but only if context is set (otherwise we are deserializing,
                    // so the context will be set later with the params already set.
                    if (ctlOptions.ctx && instance.config && instance.config.params) {
                        _.defaults(instance.ctx.params, instance.config.params);
                    }

                    instance.isBase = false;
                    return options.success(instance);
                }, function (err) {
                    return options.error(new Error('Controller create LAZO.require failed for ' + ctlPath + ' : ' + err.message));
                });
            }

            // client rehydration
            if (_.isBoolean(ctlOptions.isBase)) {
                if (ctlOptions.isBase) {
                    return loadBase();
                } else {
                    return loadCtl();
                }
            }

            // server
            resolver.isBase(ctlPath, 'controller', function (isBase) {
                if (isBase) {
                    loadBase();
                } else {
                    loadCtl();
                }
            });
        },

        deserialize: function (ctl, options) { // TODO: implement
            return serializor.deserialize(ctl, _.extend({}, options, { Controller: Controller }));
        }

    });

    return Controller;
});