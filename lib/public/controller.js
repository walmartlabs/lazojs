define([
    'underscore',
    'backbone',
    'base',
    'resolver/main',
    'utils/module',
    'lazoCollectionView',
    'lazoView',
    'utils/ctlSerializor',
    'l!jitc/main',
    'context',
    'async',
    'l!ctlNav',
    'utils/template',
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
        jitc,
        Context,
        async,
        ctlNav,
        template,
        $) {

    'use strict';

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

            if (LAZO.isClient) { // TODO: add in options for callbacks
                return ctlNav(this, this.name, action, _.extend(this.ctx.params, options.params), LAZO.app._getCrumb(), options);
            }

            options = _.defaults(options || {}, { error: function () {
                return;
            }, success: function () {
                return;
            }});

            this._execute(action, {
                error: function (err) {
                    return options.error(err);
                },
                success: function () {
                    return options.success();
                }
            });
        },

        transition: function (prevCtx, view, options) { // TODO: add hook points for animation
            if (LAZO.app.isClient && this.currentView) {
                renderer.cleanup(this, this.currentView.cid);
            }

            this.currentView = view;
            options.success(this);
        },

        setCookie: function (name, value, options) {
            this.ctx.setCookie(name, value, options);
        },

        clearCookie: function (name) {
            this.ctx.clearCookie(name);
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

        getPageTitle: function (title) {
            return this.ctx._rootCtx.pageTitle;
        },

        _getEl: function () {
            if (LAZO.app.isClient) {
                return $('[lazo-cmp-id=' + this.cid + ']');
            }
        },

        _execute: function (action, options) {
            var tasks = this._buildExecTaskList(action),
                self = this,
                ctx = {}; // TODO: replace underscore with lodash _.clone(this.ctx, true); // create a deep copy of the current context

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
            tasks.push(_.bind(this._getView, this));
            tasks.push(_.bind(this._resolveTemplateEngine, this));
            return this.ctx.isXHR ? this._buildXHRExecTaskList(tasks) : this._buildStandardExecTaskList(tasks);
        },

        _buildXHRExecTaskList: function (tasks) {
            tasks.push(_.bind(this._getTemplate, this));
            tasks.push(_.bind(this._addTemplatePathToCtx, this));
            tasks.push(_.bind(this._getItemEmptyViews, this));
            tasks.push(_.bind(this._getViewWidgets, this));
            tasks.push(_.bind(this._addItemEmptyTemplatePath, this));
            return tasks;
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
            var self = this,
                rootCtx = this.ctx._rootCtx,
                orderedCss = _.isArray(this.orderedCss) ? this.orderedCss : [];

            resolver.list('components/' + self.name + '/client', {
                    ext: '.css',
                    basePath: LAZO.FILE_REPO_PATH
                },
                function (err, cssFiles) {
                if (!rootCtx.dependencies) {
                    rootCtx.dependencies = {
                        css: []
                    };
                }

                // makes paths absolute for browser
                cssFiles = cssFiles.map(function (cssFile) {
                    return '/' + cssFile;
                });
                self.ctx.css = orderedCss.concat(cssFiles);
                rootCtx.dependencies.css = _.union(orderedCss.concat(rootCtx.dependencies.css), cssFiles);
                callback(err, viewName);
            });
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
            var self = this,
                convertedTemplatePath;
            view.templatePath = resolver.getTemplatePath(view);

            module.getTemplate(view.templatePath, function (err, template) {
                if (err) {
                    view.template = view._templateEngine.compile('', view.templatePath);
                    view.hasTemplate = false;
                    return callback(null, view);
                }

                try {
                    view.hasTemplate = true;
                    module.addPath('text!' + view.templatePath, self.ctx); // TODO: remove once template precompilation works
                    convertedTemplatePath = resolver.convertTemplatePath(view.templatePath);
                    jitc.writeTemplate(convertedTemplatePath,
                        (template || ''),
                        view.templateEngine,
                        LAZO.FILE_REPO_DIR + '/tmp',
                        function (err) {
                            if (err) { // TODO: error handling
                                throw err;
                            }
                            view.template = jitc.compileTemplate(template, view._templateEngine);
                            view.compiledTemplatePath = convertedTemplatePath;
                            // module.addPath('tmp/' + convertedTemplatePath, self.ctx); TODO: precompiling
                            return callback(err, view);
                    });
                } catch (e) {
                    return callback(e, view);
                }
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
            var self = this,
                views,
                i,
                templatesToBeCompiled,
                templatesCompiled;

            if (!(view instanceof LazoCollectionView) || !view._itemEmptyViewConstructors) {
                return callback(null, view);
            }

            views = view.getItemEmptyViews();
            i = views.length;
            templatesToBeCompiled = i;
            templatesCompiled = 0;
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
                            jitc.writeTemplate(convertedTemplatePath, views[i].template,
                                views[i].templateEngine,
                                LAZO.FILE_REPO_DIR + '/tmp', // target dir
                                function (err) {
                                    if (err) { // TODO: error handling
                                        throw err;
                                    }
                                    templatesCompiled++;
                                    views[i].template = jitc.compileTemplate(views[i].template, views[i]._templateEngine);
                                    views[i].compiledTemplatePath = convertedTemplatePath;
                                    // module.addPath('tmp/' + convertedTemplatePath, self.ctx); TODO: precompiling
                                    if (templatesToBeCompiled === templatesCompiled) {
                                        return callback(err, view);
                                    }
                            });
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