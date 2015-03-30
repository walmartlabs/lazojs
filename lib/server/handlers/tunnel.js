define(['utils/modelLoader', 'context'], function (modelLoader, Context) {

    'use strict';

    return function (req, reply) {
        var handleTunnelError = function (req, response) {
            var respText = response.body || response.error || '';
            var resp = reply(respText);
            resp.code(response.statusCode || 500);
        };

        var method = req.payload.method;
        if (method === 'GET') {
            var loadFunc,
                loadName;
            if (req.payload.model) {
                loadFunc = LAZO.app.loadModel;
                loadName = req.payload.model;
            }
            else if (req.payload.collection) {
                loadFunc = LAZO.app.loadCollection;
                loadName = req.payload.collection;
            }
            loadFunc.call(LAZO.app,
                loadName,
                {
                    ctx: new Context({
                        isTunnelRequest: true
                    }),
                    params: req.payload.params,
                    success: function (model) {
                        reply({ gmid: model._getGlobalId(), data: model.toJSON() });
                    },
                    error: function (model, response, options) {
                        LAZO.logger.error('[server.handlers.tunnel] Loading %s, error processing request %j', loadName, response);
                        handleTunnelError(req, response);
                    }
                }
            );

        }
        else if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'NONCRUD') {
            var type,
                modelName,
                payload = req.payload;
            if (payload.model) {
                type = 'model';
                modelName = payload.model;
            }
            else if (payload.collection) {
                type = 'collection';
                modelName = payload.collection;
            }

            var _handleModel = function (Model) {
                var m = new Model(payload.attributes,
                    {
                        name: modelName,
                        ctx: new Context({
                            isTunnelRequest: true
                        }),
                        params: payload.params,
                        parse: true
                    });

                if (method === 'DELETE') {
                    m.destroy({
                        success: function (model, response, options) {
                            reply({ gmid: model._getGlobalId(), data: model.toJSON() });
                        },
                        error: function (model, response, options) {
                            handleTunnelError(req, response);
                        }
                    });
                }
                else if (method === 'NONCRUD') {
                    var fname = payload.fname,
                        args = payload.args;
                    m.call(fname, args, {
                        success: function (response) {
                            reply(response);
                        },
                        error: function (response) {
                            handleTunnelError(req, response);
                        }
                    });
                }
                else {
                    m.save({},
                        {
                            success: function (model, response, options) {
                                reply({ gmid: model._getGlobalId(), data: model.toJSON() });
                            },
                            error: function (model, response, options) {
                                handleTunnelError(req, response);
                            }
                        });
                }
            };

            modelLoader(modelName, type, _handleModel);

        } else {
            LAZO.logger.debug('[server.handlers.tunnel] Error processing request method %s', method);
            var resp = req.reply({ error: 'Error processing request method: ' + method });
            resp.code(500);
        }
    };

});