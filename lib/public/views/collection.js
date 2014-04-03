define(['lazoView', 'renderer', 'underscore'], function (View, renderer, _) {

    'use strict';

    var COLLECTION_SPECIFIER = 'collection'; // value for lazo-collection-target when collection object is specified

    var LazoCollectionView = View.extend({

        constructor: function (options) {
            var collection;
            options = options || {};
            this._augmentKeys = View.prototype._augmentKeys.concat(['itemView', 'emptyView']);
            if (_.isString((collection = options.collection || this.collection))) {
                this.collection = options.ctl.ctx.collections[collection];
            }
            View.call(this, options);

            this.itemViewOptions = this.options.itemViewOptions || this.itemViewOptions;
            this.itemViewOptions = this.itemViewOptions || {};
            this._itemViews = {};
            this._emptyViews = {};
            this._isEmptyViewShown = {};
            return this;
        },

        getInnerHtml: function () {
            return this._getCollectionHtml(View.prototype.getInnerHtml.call(this));
        },

        getItemView: function (model, collection) {
            return this._getItemEmptyView('itemView', collection);
        },

        getEmptyView: function (collection) {
            return this._getItemEmptyView('emptyView', collection);
        },

        resolveView: function (viewName) {
            return this._itemEmptyViewConstructors[viewName];
        },

        addItemView: function (view, $target, collection) {
            $target.append(view.el);
            return this;
        },

        removeItemView: function (view, $target, collection) {
            view.remove();
            return this;
        },

        renderCollection: function (views, $target, collection) {
            _.each(views, function (view) {
                $target.append(view.el);
            });
            return this;
        },

        getCollections: function () {
            var collectionNames = this._findCollectionNames(View.prototype.getInnerHtml.call(this)),
                collections = [],
                collection,
                self = this;

            if (this.collection) {
                if (_.isString(this.collection) && (collection = this.ctl.ctx.collections[this.collection])) {
                    collections.push(collection);
                } else {
                    collections.push(this.collection);
                }
            } else if (collectionNames && collectionNames.length) {
                collections = _.map(collectionNames, function (collectionName) {
                    return self._getCollection(collectionName);
                });
            }

            return collections;
        },

        getItemEmptyViews: function () {
            var self = this,
                views = [],
                view;

            _.each(this.getCollections(), function (collection) {
                if (collection.length) {
                    collection.each(function (model) {
                        views.push(self._getItemViewInstance(model, collection));
                    });
                } else {
                    if ((view = self._getEmptyViewInstance(collection))) {
                        views.push(view);
                    }
                }
            });

            return views;
        },

        attachItemViews: function () { // TODO: make private method
            var collectionNames = this._findCollectionNames(this.$el.html()),
                self = this,
                attachItemView,
                iterateAndListen,
                view,
                View;

            attachItemView = function (view, $el) {
                renderer.attachView(view, $el[0]);
            };

            iterateAndListen = function (collection, name) {
                self._listenToCollection(collection);

                if (!collection.length) {
                    if ((view = self._getEmptyViewInstance(collection))) {
                        self._isEmptyViewShown[collection.cid] = true;
                        renderer.attachView(view, self._getCollectionTarget(collection).children()[0]);
                    }
                } else {
                    collection.each(function (model) {
                        var $el = self._getViewEl(model);
                        attachItemView(self._getItemViewInstance(model, collection, { cid: $el.attr('lazo-view-id') }), $el);
                    });
                }
            };

            if (collectionNames) {
                _.each(collectionNames, function (name) {
                    var c = self._getCollection(name);
                    if(c){
                        iterateAndListen(c, name);
                    }
                });
            } else if (this.collection) {
                iterateAndListen(this.collection);
            }

            return this;
        },

        // Atrribute used to mark collection targets.
        _targetAttr: 'lazo-collection-target',

        // Hash of item view instances. Key is the model id associated to the view instance.
        _itemViews: null,

        // Hash of empty view instances. Key is the collection id associated to the view instance.
        _emptyViews: null,

        // Used to store the showing state of a collection empty view.
        _isEmptyViewShown: null,

        // Generates a string representation of item view instances el or an empty view el if collection is not populated.
        _getItemViewsHtml: function (collection) {
            var html = '',
                self = this,
                view;

            if (!collection.length) {
                if ((view = this._getEmptyViewInstance(collection))) {
                    this._isEmptyViewShown[collection.cid] = true;
                    return view.getHtml();
                } else { // empty view not defined
                    return html;
                }
            }

            this._removeEmptyView(collection);
            collection.each(function (model) {
                html += self._getItemViewInstance(model, collection).getHtml();
            });

            return html;
        },

        /**
         * Returns name of view to be used by collection based on view type, item or empty.
         *
         * views: {
         *     collectionName: {
         *         itemView: 'itemView',
         *         emptyView: ['emptyView1', 'emptyView2']
         *     }
         * }
         *
         * itemView: ['itemView1', 'itemView2'],
         * emptyView: 'emptyView',
         */
        _getItemEmptyViewName: function (type, collection) {
            var collectionName = this._getCollectionName(collection),
                viewName = collectionName && this.views && this.views[collectionName] ? this.views[collectionName][type] :
                    this[type];

            return _.isArray(viewName) ? viewName[0] : viewName;
        },

        // Returns the view constructor to be used by collection based on view type, item or empty.
        _getItemEmptyView: function (type, collection) {
            var viewName = this._getItemEmptyViewName(type, collection);

            if (!viewName && type === 'emptyView') {
                return;
            } else if (!viewName) {
                throw type + ' view not found.';
            }

            return this.resolveView(viewName);
        },

        // Gets the name of a collection.
        _getCollectionName: function (collection) {
            var collections;
            if (this.collection) {
                if (!_.isString(this.collection)) {
                    return COLLECTION_SPECIFIER;
                } else {
                    return;
                }
            }

            collections = this.ctl.ctx.collections;
            for (var key in collections) {
                if (collections[key] === collection) {
                    return key;
                }
            }
        },

        // Gets the item view $el for a model.
        _getViewEl: function (model) {
            return this.$('[lazo-model-id="' + model.cid + '"]');
        },

        // Sets up view, does internal cleanup, and calls public method.
        _addItemView: function (model, collection) {
            var view = this._getItemViewInstance(model, collection);

            this._removeEmptyView(collection);
            view.render();
            view.afterRender();
            this.addItemView(view, this._getCollectionTarget(collection), collection);
            return this;
        },

        // Destroys view, does internal cleanup, and calls public method.
        _removeItemView: function (model, collection) {
            var view,
                self = this;

            if(this._itemViews[model.cid]){
                this._itemViews[model.cid].once('remove', function () {
                    renderer.cleanupView(self._itemViews[model.cid]);
                    delete self._itemViews[model.cid];
                });
                this.removeItemView(this._itemViews[model.cid], this._getCollectionTarget(collection), collection);
            }

            if (!collection.length) {
                if ((view = this._getEmptyViewInstance(collection))) {
                    this._isEmptyViewShown[collection.cid] = true;
                    view.render();
                    this.addItemView(view, this._getCollectionTarget(collection), collection);
                }
            }
            return this;
        },

        // Gets the collection target $el
        _getCollectionTarget: function (collection) {
            var name = this._getCollectionName(collection);
            return name ? $('[' + this._targetAttr + '="' + name + '"]') : this.$el;
        },

        // Renders a collection on the client.
        _renderCollection: function (collection) {
            var self = this,
                views = [],
                $target = self._getCollectionTarget(collection),
                view;

            // Empty existing collection
            $target.empty();

            if (!collection.length) {
                if ((view = this._getEmptyViewInstance(collection))) {
                    this._isEmptyViewShown[collection.cid] = true;
                    view.render();
                    self.renderCollection([view], self._getCollectionTarget(collection), collection);
                    return this;
                } else { // empty view not defined
                    self.renderCollection([], self._getCollectionTarget(collection), collection);
                    return this;
                }
            }

            this._removeEmptyView(collection);
            collection.each(function (model) {
                view = self._getItemViewInstance(model, collection);
                view.render();
                views.push(view);
            });

            self.renderCollection(views, self._getCollectionTarget(collection));
            return this;
        },

        _removeEmptyView: function (collection) {
            var view,
                self = this;

            if (this._isEmptyViewShown[collection.cid]) {
                view = this._emptyViews[collection.cid];
                this._isEmptyViewShown[collection.cid] = false;

                view.once('remove', function () {
                    renderer.cleanupView(view);
                    delete self._emptyViews[collection.cid];
                });
                this.removeItemView(view, this._getCollectionTarget(collection), collection);
            }

            return this;
        },

        _listenToCollection: function (collection) {
            this.listenTo(collection, 'add', this._addItemView, this);
            this.listenTo(collection, 'remove', this._removeItemView, this);
            this.listenTo(collection, 'reset', this._renderCollection, this);

            return this;
        },

        _getCollection: function (name) {
            return name === COLLECTION_SPECIFIER ? this.collection : this.ctl.ctx.collections[name];
        },

        _getCollectionHtml: function (html) {
            var collectionNames = this._findCollectionNames(html),
                self = this,
                collectionHtml = {};

            if (collectionNames.length) { // collection targets defined in template; get html for each collection
                _.each(collectionNames, function (collectionName) {
                    collectionHtml[collectionName] = self._getItemViewsHtml(self._getCollection(collectionName));
                });
                return this._insertCollectionHtml(collectionNames, collectionHtml, html);
            } else if (this.collection) { // collection is inserted directly under this.el
                return this._getItemViewsHtml(this.collection);
            } else { // no collection found or defined
                return html;
            }
        },

        _insertCollectionHtml: function (collectionNames, collectionHtml, htmlBuffer) {
            var match,
                htmlOpen,
                htmlClose,
                self = this;

            _.each(collectionNames, function (collectionName) {
                match = renderer.getInsertIndex(self._targetAttr, collectionName, htmlBuffer);
                htmlOpen = htmlBuffer.substr(0, match.index + match[0].length);
                htmlClose = htmlBuffer.substr(match.index + match[0].length);
                htmlBuffer = htmlOpen + collectionHtml[collectionName] + htmlClose;
            });

            return htmlBuffer;
        },

        _findCollectionNames: function (html) { // TODO: there has to be a better regex; shouldn't need the while loop
            var htmlSubstr = html,
                match = true,
                names = [],
                start = 0;

            while (match) {
                htmlSubstr = htmlSubstr.substr(start);
                match = htmlSubstr.match(/<[^>]*\s(?:lazo-collection-target=["']([^"']*)["'])[^>]*>/); // TODO: use this._targetAttr
                if (match) {
                    names.push(match[1]);
                    start = match[0].length + match.index;
                }
            }

            return names;
        },

        _getEmptyViewInstance: function (collection) {
            var view,
                View,
                self = this,
                name;

            if (!(view = self._emptyViews[collection.cid])) {
                if ((view = this._createItemEmptyView('emptyView', collection, { collection: collection }))) {
                    self._emptyViews[collection.cid] = view;
                }
            }

            return view;
        },

        _getItemViewInstance: function (model, collection, options) {
            var view,
                View,
                self = this,
                name;

            if (!(view = self._itemViews[model.cid])) {
                options = options || {};
                view = self._itemViews[model.cid] = this._createItemEmptyView('itemView', collection, _.extend({ model: model }, options));
            }

            return view;
        },

        _createItemEmptyView: function (viewType, collection, options) {
            var self = this,
                name = this._getItemEmptyViewName(viewType, collection),
                View = viewType === 'itemView' ? self.getItemView(options.model, collection) :
                    self.getEmptyView(collection);


            if (!View) { // empty view not defined
                return;
            }

            // template values cannot be determined during construction because view instances
            // are constucted by the controller to determine the template dependencies for
            // a collection view item and empty views.
            return new View(_.extend({
                ctl: self.ctl,
                collection: collection,
                name: name,
                ref: self.ctl._getPath(name, 'view'),
                baseBath: self.ctl._getBasePath(name, 'view'),
                render: function () {
                    if (!_.isFunction(this.template)) {
                        this.template = self._getItemEmptyViewTemplate(this);
                    }
                    this.$el.html(this.getInnerHtml());
                    return this;
                },
                getInnerHtml: function () {
                    if (!_.isFunction(this.template)) {
                        this.template = self._getItemEmptyViewTemplate(this);
                    }
                    return View.prototype.getInnerHtml.call(this);
                }
            }, options));
        },

        _getItemEmptyViewTemplate: function (view) {
            var templateName = _.result(view, 'templateName') || view.name,
                template = this._itemEmptyViewTemplates[templateName];

            // this._itemEmptyViewTemplates contents differ depending on how and when they were populated
            return _.isObject(template) ? template.template : this._templateEngine.compile(template);
        },

        _onRemove: function () {
            var self = this;
            _.each(this._itemViews, function (view, key) {
                renderer.cleanupView(view);
                delete self._itemViews[key];
            });

            _.each(this._emptyViews, function (view, key) {
                renderer.cleanupView(view);
                delete self._emptyViews[key];
            });

            return this;
        }

    });

    return LazoCollectionView;

});