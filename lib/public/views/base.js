define(['jquery', 'underscore', 'backbone', 'renderer'], function ($, _, Backbone, renderer) {

    'use strict';

    var LazoView = Backbone.View.extend({

        constructor: function (options) {
            this.isServer = LAZO.app.isServer;
            this.isClient = LAZO.app.isClient;
            // Backbone.View.prototype constructor with the exception of _augment
            this.cid = _.uniqueId('view');
            this._augment(options || {}); // override cid before delegateEvents is called
            this._configure(options || {});
            this._ensureElement();
            this.initialize.apply(this, arguments);
            this.delegateEvents();
            this._getTemplateEngine();
        },

        serialize: function (obj, exceptions) { // serialize an object
            var data = {};

            for (var k in obj) { // do not use _.each; it uses hasOwnProp;
                if ((_.isObject(obj[k]) || _.isArray(obj[k]) || _.isString(obj[k]) || _.isNumber(obj[k])) && // white list
                    (!exceptions[k] && !_.isFunction(obj[k]))) { // black list
                    if (k === 'models' || k === 'collections') { // serialize the models and collections from ctl.ctx
                        data[k] = {};
                        for (var j in obj[k]) {
                            if (obj[k][j].toJSON) {
                                data[k][j] = obj[k][j].toJSON();
                            } else {
                                data[k][j] = obj[k][j];
                            }
                        }
                    } else if (obj[k] instanceof Backbone.Collection || obj[k] instanceof Backbone.Model) {
                        data[k] = obj[k].toJSON();
                    } else {
                        data[k] = obj[k];
                    }
                }
            }

            if (obj._rootCtx) {
                data.crumb = obj._rootCtx.cookies && obj._rootCtx.cookies.crumb ? obj._rootCtx.cookies.crumb : '';
                _.extend(data, obj._rootCtx.data);
            }

            return data;
        },

        render: function () {
            if (this.isServer) {
                throw 'view, ' + this.name + ', attempted to call render on the server.';
            }

            this.ctl._getEl().html(renderer.getHtml(this.ctl, this.cid, 'view'));
            renderer.attachViews(this.ctl);
            return this;
        },

        getHtml: function () { // get view html
            return this._wrapperEl(this.getInnerHtml());
        },

        // Overrides Backbone.prototype.setElement. Sets LazoView attributes.
        setElement: function () { // set view el attribues after bb.prototype.setElement is called
            var response = Backbone.View.prototype.setElement.apply(this, arguments);
            this._setElAttrs();
            return response;
        },

        serializeData: function () { // serialize data for rendering
            return this.transformData(_.extend(this.serialize(this.ctl.ctx, this._exclusions), this.serialize(this, this._exclusions)));
        },

        transformData: function (data) { // hook point for developers to modify data before passing to the template
            return data;
        },

        addExclusion: function (exclusion) { // add property key to serialization exclusions list
            this._exclusions[exclusion] = true;
            return this;
        },

        removeExclusion: function (exclusion) { // remove property key from serialization exclusions list
            delete this._exclusions[exclusion];
            return this;
        },

        afterRender: function () {},

        getInnerHtml: function () { // get view html minus this.el string wrapper
            return this._templateEngine.execute(this.template, this.serializeData(), this.templatePath);
        },

        onRemove: function () {},

        onAttach: function () {},

        remove: function () {
            Backbone.View.prototype.remove.call(this);
            this.trigger('remove');
            return this;
        },

        _augment: function (options) {
            _.extend(this, _.pick(options, this._augmentKeys));
        },

        // Names used to lookup properties in the options object and augment the view instance.
        _augmentKeys: ['ctl', 'cid', 'template', 'name', 'render', 'templateEngine', 'templatePath', 'ref', 'basePath', 'isBase', 'hasTemplate', 'getInnerHtml', 'compiledTemplatePath'],

        // Names used to lookup properties in the options object and augment the view instance.
        _exclusions: { ctl: true, $el: true, el: true, parent: true, options: true }, // properties that are not serialized

        // Used to lookup values and assign them to view instance el as attributes.
        _elAttributes: {

            'lazo-view-name': 'view:name',

            'lazo-view-id': 'view:cid',

            'lazo-model-name': 'view:model.name',

            'lazo-model-id': 'view:model.cid',

            'lazo-collection-name': 'view:collection.name',

            'lazo-collection-id': 'view:collection.cid'

        },

        // Generates a string representation of view instance el and wraps html string passed.
        _wrapperEl: function (html) { // generate string representation of this.el
            var elHtmlOpen,
                elHtmlClose,
                attrsStr = '',
                attrs = _.extend({}, _.result(this, 'attributes'), this._setElAttrs());

            if (this.id) {
                attrs.id = _.result(this, 'id');
            }
            if (this.className) {
                attrs['class'] = _.result(this, 'className');
            }

            _.each(attrs, function (val, key) {
                attrsStr += ' ' + key + '="' + val + '"';
            });

            elHtmlOpen = '<' + _.result(this, 'tagName') + attrsStr + '>';
            elHtmlClose = '</' + _.result(this, 'tagName') + '>';

            return elHtmlOpen + html + elHtmlClose;
        },

        // Creates a hash of attributes used when creating this.el or the string represenation of this.el.
        _setElAttrs: function () { // add el data attributes
            var attrs = {},
                self = this;

            _.each(this._elAttributes, function (val, key) {
                if (!_.isUndefined(val = self._resolveAttrVal(val))) {
                    attrs[key] = val;
                }
            });

            if (!this.isServer) {
                this.$el.attr(attrs);
            }

            return attrs;
        },

        // Resolves an attribute value based on the lookup convention defined in this._elAttributes.
        _resolveAttrVal: function (key) {
            var retVal,
                parts,
                viewKeyParts = key.split(':'),
                viewKey,
                struct = this;

            if (viewKeyParts.length && viewKeyParts[0] === 'view') {
                viewKey = viewKeyParts[1];
                if ((parts = viewKey.split('.')).length) {
                    _.each(parts, function (part) { // attempt to build out chain
                        if (!_.isUndefined(struct)) {
                            struct = struct[part];
                        }
                    });

                    retVal = struct;
                } else {
                    retVal = this[viewKey];
                }
            } else {
                retVal = _.result(key);
            }

            return retVal;
        },

        // Returns a reference to the view's template engine based on this.templateEngine.
        _getTemplateEngine: function () {
            if (!this._templateEngine) {
                this.templateEngine = this.templateEngine || LAZO.app.getDefaultTemplateEngineName();
                this._templateEngine = LAZO.app.getTemplateEngine(this.templateEngine);
            }

            return this._templateEngine;
        }

    });

    return LazoView;

});