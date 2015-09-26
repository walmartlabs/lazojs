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
    'renderer',
    'l!destroyCmp',
    'utils/uniqueId',
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
        $,
        renderer,
        destroyCmp,
        uniqueId) {

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

            this.cid = uniqueId(options.name);
            this.ctx = options.ctx;
            this.name = options.name;
        },

        orderedCss: [],

        addChild: function (container, cmpName, options) {
            var self = this;
            var action = options.action || 'index';
            var index = _.isNumber(options.index) ? options.index :
                (this.children && this.children[container] ? this.children[container].length : 0);
            options = this._setOptions(options);

            module.addChild(container, cmpName, this, {
                index: index,
                params: options.params,
                action: action,
                success: function (child) {
                    child.parent = self;
                    if (LAZO.app.isClient) {
                        var $container = self._getEl()
                            .find('[lazo-cmp-container="' + container + '"]');
                        var $components = $container.children('[lazo-cmp-name]');
                        renderer.getNodeHtml(child, function (html) {
                            if (!$components.length) {
                                $container.append(html);
                            } else {
                                var $component = $($components[index]);

                                if ($component.length) {
                                    $component.before(html);
                                } else {
                                    $components.last().after(html);
                                }
                            }

                            if (options.render) {
                                child.currentView.render({
                                    success: function () {
                                        options.success(child);
                                    },
                                    error: options.error
                                });
                            } else {
                                options.success(child);
                            }
                        });
                    } else {
                        options.success(child);
                    }
                },
                error: options.error || function (err) {
                    throw error;
                }
            });
        },

        removeChild: function (child, options) {
            var location = (function (children, child) {
                for (var k in children) {
                    for (var i = 0; i < children[k].length; i++) {
                        if (children[k][i] === child) {
                            return {
                                container: k,
                                index: i
                            };
                        }
                    }
                }
            })(this.children, child);
            options = this._setOptions(options);

            if (!child) {
                LAZO.logger.warn('[controller.removeChild], %s, child is argument is required.', this.name);
                return options.success();
            }

            if (!location) {
                LAZO.logger.warn('[controller.removeChild] could not locate child, %s, of parent, %s', child.name, this.name);
                return options.success();
            }

            if (LAZO.app.isClient && location) {
                destroyCmp(child);
            }

            this.children[location.container].splice(location.index, 1);
            this.onChildRemove(child, options);
        },

        remove: function (options) {
            var child = this;
            var parent = this.parent;
            options = this._setOptions(options);

            if (!this.parent) {
                LAZO.logger.warn('[controller.remove] could not locate child, %s, of parent, %s', child.name, this.name);
                return options.success();
            }

            parent.removeChild(child, options);
        },

        onChildRemove: function (child, options) {
            options = this._setOptions(options);
            options.success();
        },

        index: function (options) {
            return options.success('index');
        },

        navigate: function (action, options) {
            var self = this;
            var children = this.children;
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
                params: _.extend(this.ctx.params, options.params),
                assets: this.ctx.assets,
                css: this.ctx.css,
                headers: this.ctx.headers,
                meta: this.ctx.meta
            });

            if (LAZO.app.isClient) {
                this._getEl().addClass('lazo-navigating');
            }

            // delete children, so that they do not get rendered
            delete this.children;
            this._execute(action, {
                ctlNavigate: true,
                // pass children from previous execution
                // so that they can be cleaned up by this.transition
                prevChildren: children,
                error: function (err) {
                    return options.error(err);
                },
                success: function () {
                    self._getEl().removeClass('lazo-navigating').addClass('lazo-navigated');
                    options.success();
                }
            });
        },

        transition: function (view, options) {
            var self = this;
            if (LAZO.app.isClient && this.currentView) {
                viewManager.cleanup(this, this.currentView.cid);
                // clean up children from previous execution
                if (options.children) {
                    for (var k in children) {
                        if (children[k].length) {
                            for (var i = 0; i < children[k].length; i++) {
                                viewManager.cleanup(children[k][i], children[k][i].currentView.cid);
                            }
                        }
                    }
                }
            }

            this.currentView = view;
            // only render html if ctl.navigate was called
            // TODO: ensure views are getting attached
            if (LAZO.app.isClient && options.ctlNavigate) {
                view.render({
                    error: options.error,
                    success: function (html) {
                        options.success(self);
                    }
                });
            } else {
                options.success(self);
            }
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

        addPageTag: function (name, attributes, content) {
            LAZO.app.addPageTag(this.ctx, name, attributes, content);
            return this;
        },

        getPageTags: function () {
            return LAZO.app.getPageTags(this.ctx);
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

        setHttpStatusCode: function (statusCode) {
            if (LAZO.app.isClient) {
                return this;
            }

            this.ctx.setHttpStatusCode(statusCode);
            return this;
        },

        getHttpStatusCode: function () {
            if (LAZO.app.isClient) {
                return null;
            }

            return this.ctx.getHttpStatusCode();
        },

        addHttpHeader: function (name, value, options) {
            if (LAZO.app.isClient) {
                return this;
            }

            this.ctx.addHttpHeader(name, value, options);
            return this;
        },

        getHttpHeaders: function () {
            if (LAZO.app.isClient) {
                return [];
            }

            return this.ctx.getHttpHeaders();
        },

        addHttpVaryParam: function (varyParam) {
            if (LAZO.app.isClient) {
                return this;
            }

            this.ctx.addHttpVaryParam(varyParam);
            return this;
        },

        getHttpVaryParams: function () {
            if (LAZO.app.isClient) {
                return [];
            }

            // return this.ctx.response.varyParams || [];
            return this.ctx.getHttpVaryParams();
        },

        _setOptions: function (options) {
            var defaultOptions = {
                success: function () {},
                error: function (err) {
                    throw err;
                }
            };
            options = options || {};

            return _.defaults(options, defaultOptions);
        },

        _getEl: function () {
            if (LAZO.app.isClient) {
                return $('[lazo-cmp-id="' + this.cid + '"]');
            }
        },

        _execute: function (action, options) {
            var tasks = this._buildExecTaskList(action);
            var self = this;

            async.waterfall(tasks, function (err, view) {
                if (err) {
                    options.error(err);
                } else {
                    self.transition(view, options);
                }
            });
        },

        _createView: function (View, options) {
            try {
                return new View(_.extend({
                    ref: resolver.getPath(options.name, this.name, 'view'),
                    basePath: resolver.getBasePath(options.name, this.name, 'view'),
                    ctl: this,
                    cid: uniqueId('view')
                }, options));
            } catch (e) {
                throw e;
            }
        },

        _buildExecTaskList: function (action) {
            var tasks = [];
            var self = this;

            tasks.push(function (callback) {
                callback(null, action);
            });
            tasks.push(_.bind(this._action, this));
            tasks.push(_.bind(this._getCss, this));
            tasks.push(_.bind(this._getImports, this));
            tasks.push(_.bind(this._getView, this));
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
                        if (!_.isString(viewName)) {
                            callback(new Error('Controller action method options.success requires a view or template name'), null);
                        }
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