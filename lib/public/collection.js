define(['underscore', 'backbone', 'proxy', 'lazoModel'], function (_, Backbone, Proxy, LazoModel) {
    'use strict';

    /**
     * A base class for collections
     *
     * @class LazoCollection
     * @constructor
     * @param {Array Models} models An array of models
     * @param {Object} options
     *      @param {String} options.name The name of the collection in the repo
     *      @param {Object} options.params A hash of name-value pairs used in url substitution
     *      @param {Context} options.ctx The current context for the request
     *      @param {String} [options.modelName] Specify the LazoModel class that the collection contains.  This
     *      should be the name of the model in the repo.  This *MUST* be used with the Backbone.Collection model property.
     * @extends Backbone.Collection
     */
    var Collection = Backbone.Collection.extend({

        constructor: function(attributes, options) {
            this._initialize(attributes, options);
            this.cid = _.uniqueId('c');
            if (options.modelName) {
                this.modelName = options.modelName;
            }
            Backbone.Collection.apply(this, arguments);
        },

        sync: function(method, model, options) {
            var self = this,
                success = options.success;

            options.success = function (resp) {
                self._resp = resp;

                if (success) {
                    success(resp);
                }
            };

            Proxy.prototype.sync.call(this, method, options);
        },

        call: function(fname, args, options) {
            Proxy.prototype.callSyncher.call(this, fname, args, options);
        },

        _initialize: function(attributes, options) {
            LazoModel.prototype._initialize.apply(this, arguments);
        },

        _getGlobalId: function() {
            return LazoModel.prototype._getGlobalId.apply(this);
        },

        // taken directly from Backbone.Collection._prepareModel, except where noted by comments
        _prepareModel: function(attrs, options) {
            if (attrs instanceof Backbone.Model) {
                if (!attrs.collection) attrs.collection = this;
                return attrs;
            }
            options || (options = {});
            options.collection = this;

            // begin lazo specific overrides
            if (this.modelName) {
                if (_.isFunction(this.modelName)) {
                    options.name = this.modelName(attrs, options);
                }
                else {
                    options.name = this.modelName;
                }
            }
            options.ctx = this.ctx;
            // end lazo specific overrides

            var model = new this.model(attrs, options);
            if (!model._validate(attrs, options)) {
                this.trigger('invalid', this, attrs, options);
                return false;
            }
            return model;
        }

    });

    return Collection;
});
