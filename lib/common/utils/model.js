define(['lazoModel', 'utils/modelLoader', 'utils/module'], function (LazoModel, modelLoader, module) {

    'use strict';

    return {

        process: function (modelName, options, type) {
            var modelInstances = options.ctx._rootCtx.modelInstances,
                modelList = options.ctx._rootCtx.modelList,
                gid = LazoModel._getGlobalId(modelName, options.params),
                path = 'models/' + modelName + '/' + type;

            function checkProcessing() {
                if (modelInstances[gid] === null) {
                    return;
                }
                else if (modelInstances[gid].processing) {
                    setTimeout(checkProcessing, 0);
                }
                else if (options.success) {
                    _.defer(options.success, modelInstances[gid]);
                }
            }

            options.error = options.error || function (err) {
                throw err;
            }; // user did not define error bubble up 500

            if (modelInstances[gid]) {
                checkProcessing();
                return;
            }

            modelInstances[gid] = {};
            modelInstances[gid].processing = true;
            var _fetch = function (Model, _default) {
                var data = modelList[gid] && modelList[gid].data ? modelList[gid].data : null;
                var m = new Model(data, {name: modelName, ctx: options.ctx, params: options.params, parse: data !== null});
                var registerModel = function (m, options) {
                    // add model meta info to modelList
                    var modelMeta = {
                        data: m._resp,
                        cid: m.cid,
                        id: m.id,
                        name: m.name,
                        params: options.params
                    };

                    if (type === 'collection') {
                        modelMeta.idMap = [];
                        m.each(function (model) {
                            modelMeta.idMap.push({cid: model.cid, id: model.id});
                        });
                    }

                    m.ctx._rootCtx.modelList[gid] = modelMeta;
                    m.ctx._rootCtx.modelInstances[gid] = m;
                    if (options.success) {
                        return options.success(m);
                    }
                };

                m._default = _default;
                if (options.params && type === 'model') {
                    m.id = _.result(options.params, m.idAttribute);
                }
                if (!_default) {
                    module.addPath(path, options.ctx);
                }

                // if data in list don't make tunnel call
                if (modelList[gid]) {
                    m.cid = modelList[gid].cid;
                    m._default = _default;
                    if (modelList[gid].idMap) {
                        _.each(modelList[gid].idMap, function (elem) {
                            var modelItem = m.get(elem.id);
                            if (modelItem) {
                                modelItem.cid = elem.cid;
                            }
                        });
                    }

                    modelInstances[gid] = m;
                    if (options.success) {
                        options.success(m);
                    }
                    return;
                }
                else if (options.fetch === false) {
                    registerModel(m, options);
                }
                else {
                    m.fetch({
                        success: function (m) {
                            registerModel(m, options);
                        },
                        error: function (model, response, opts) {
                            modelInstances[gid] = null;
                            LAZO.logger.debug(['common.utils.model.process'], 'Error loading model %s', modelName);
                            if (options.error) { // TODO: error handling
                                return options.error(model, response, opts);
                            }
                        }
                    });
                }

            };

            modelLoader(modelName, type, _fetch);
        },

        create: function (name, attributes, options, type) {
            var _create = function (Model, _default) {

                var modelInstances = options.ctx._rootCtx.modelInstances,
                    modelList = options.ctx._rootCtx.modelList,
                    gid = LazoModel._getGlobalId(name, options.params);

                if (modelInstances[gid]) {
                    options.success(modelInstances[gid]);
                    return;
                }

                var m = new Model((type === 'model' ? attributes : null), {name: name, ctx: options.ctx, params: options.params, parse: true});
                m._default = _default;
                var modelMeta = {
                    data: (type === 'model' ? attributes : null),
                    cid: m.cid,
                    id: m.id,
                    name: m.name,
                    params: options.params
                };
                m.ctx._rootCtx.modelList[gid] = modelMeta;
                m.ctx._rootCtx.modelInstances[gid] = m;

                if (type === 'model') {

                    if (options.persist == false) {
                        options.success(m);
                    }
                    else {
                        m.save({}, {
                            success: function (model) {
                                if (options.success) {
                                    options.success(model);
                                }
                            },
                            error: function (model, xhr, opts) {
                                LAZO.logger.error(['common.utils.model.createModel'], 'Error creating model %s', name, xhr);
                                if (options.error) {
                                    return options.error(model, xhr, opts);
                                }
                            }
                        });
                    }
                }
                else {
                    if (!_.isArray(attributes)) {
                        if (options.error) {
                            options.error(m, 'attributes must be an array', options);
                        }
                        return;
                    }

                    _.each(attributes, function (modelData) {
                        m.create(modelData);
                    });

                    if (options.success) {
                        options.success(m);
                    }
                }
            };

            modelLoader(name, type, _create);
        }

    };

});
