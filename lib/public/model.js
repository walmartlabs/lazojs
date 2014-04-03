define(['underscore', 'backbone', 'proxy', 'resolver/model', 'async'], function (_, Backbone, Proxy, helpers, async) {
    'use strict';

    /**
     * A base class for models
     *
     * @class LazoModel
     * @constructor
     * @param {Object} attributes A hash of name-value pairs that will be the model's state
     * @param {Object} options
     *      @param {String} options.name The name of the model in the repo
     *      @param {Object} options.params A hash of name-value pairs used in url substitution
     *      @param {Context} options.ctx The current context for the request
     * @extends Backbone.Model
     */
    var LazoModel = Backbone.Model.extend({

            constructor: function(attributes, options) {
                this._initialize(attributes, options);
                Backbone.Model.apply(this, arguments);
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

                //ignoring model since this==model passed by backbone sync
                Proxy.prototype.sync.call(this, method, options);
            },

            call: function(fname, args, options) {
                Proxy.prototype.callSyncher.call(this, fname, args, options);
            },

            _initialize: function(attributes, options) {
                if (options.name) {
                    this.name = options.name;
                }
                this.params = options.params;
                this.ctx = options.ctx;
            },

            _getGlobalId: function() {
                return LazoModel._getGlobalId(this.name, this.params);
            }

        },
        {
            _serialize: function (models, serModelObj) {
                _.each(models, function (value, key, list) {
                    serModelObj[key] = value._getGlobalId();
                });
            },

            _deserialize: function (ctl, _rootCtx, options) {
                LAZO.require(['utils/modelLoader'], function (modelLoader) {
                    var mdlFuncs = [];
                    var processModel = function (value, key, type) {
                        var glMdlMeta = _rootCtx.modelList[value],
                            modelInstances = _rootCtx.modelInstances;

                        mdlFuncs[mdlFuncs.length] = function (asyncCb) {
                            var gid = LazoModel._getGlobalId(glMdlMeta.name, glMdlMeta.params);

                            function checkProcessing() {
                                if (modelInstances[gid].processing) {
                                    setTimeout(checkProcessing, 50);
                                }
                                else {
                                    ctl.ctx[type + 's'][key] = modelInstances[gid];
                                    asyncCb(null, modelInstances[gid]);
                                }
                                return;
                            }

                            if (modelInstances[gid]) {
                                checkProcessing();
                                return;
                            }
                            else {
                                modelInstances[gid] = {};
                                modelInstances[gid].processing = true;

                                var _initModel = function (Model, _default) {
                                    var m = new Model(glMdlMeta.data, {name: glMdlMeta.name, ctx: ctl.ctx, params: glMdlMeta.params, parse: true});
                                    modelInstances[gid] = m;
                                    m.cid = glMdlMeta.cid;
                                    m._default = _default;

                                    if (glMdlMeta.idMap) {
                                        _.each(glMdlMeta.idMap, function (elem) {
                                            var modelItem = m.get(elem.id);
                                            if (modelItem) {
                                                modelItem.cid = elem.cid;
                                            }
                                        });
                                    }

                                    ctl.ctx[type + 's'][key] = m;

                                    return asyncCb(null, m);
                                };

                                modelLoader(glMdlMeta.name, type, _initModel);
                            }
                        };
                    };

                    // models
                    _.each(ctl.ctx.models, function (value, key, list) {
                        processModel(value, key, 'model');
                    });
                    // collections
                    _.each(ctl.ctx.collections, function (value, key, list) {
                        processModel(value, key, 'collection');
                    });
                    // load models and collections in parallel
                    async.parallel(
                        mdlFuncs,
                        function (err, results) {
                            if (err) {
                                return options.error(err);
                            }
                            return options.success();
                        }
                    );
                });
            },

            _getGlobalId: function (modelName, params) {
                var globalModelId = 'GET:'+modelName;

                if (modelName.indexOf("u:") === 0 || modelName.indexOf("http") === 0) {
                    if (params) {
                        globalModelId = helpers.substitute(globalModelId, params);
                    }
                }
                else {
                    if (params) {
                        var props = _.keys(params);
                        props.sort();
                        _.each(props, function(element, index, list) {
                            globalModelId = globalModelId + "|" + element + "=" + params[element];
                        });
                    }
                }

                return globalModelId;
            }
        }

    );

    return LazoModel;
});
