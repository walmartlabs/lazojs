define(['utils/modelLoader', 'context', 'handlers/utils', 'httpResponse'], function (modelLoader, Context, utils, httpResponse) {

    'use strict';

    return function (req, reply) {
        var handleTunnelResponse = function (ctx, hapiResponse, statusCode) {
            httpResponse.applyHttpResponseData(hapiResponse, httpResponse.getTunnelHttpResponseData(ctx, statusCode));
        };

        var handleTunnelCallError = function (ctx, response) {
            var respText = response.body || response.error || '';
            handleTunnelResponse(ctx, reply(respText), response.statusCode || 500);
        };

        var handleTunnelCallSuccess = function (ctx, response) {
            handleTunnelResponse(ctx, reply(response), 200);
        };

        var handleTunnelSyncSuccess = function (model, response) {
            handleTunnelCallSuccess(model.ctx, { gmid: model._getGlobalId(), data: model.toJSON() });
        };

        var handleTunnelSyncError = function (model, response) {
            handleTunnelCallError(model.ctx, response);
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
                    ctx: new Context(utils.createCtxOptions(req, reply, {
                        isTunnelRequest: true
                    })),
                    params: req.payload.params,
                    success: function (model) {
                        handleTunnelSyncSuccess(model, {});
                    },
                    error: function (model, response, options) {
                        LAZO.logger.error('[server.handlers.tunnel] Loading %s, error processing request %j', loadName, response);
                        handleTunnelSyncError(model, response);
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
                        ctx: new Context(utils.createCtxOptions(req, reply, {
                            isTunnelRequest: true
                        })),
                        params: payload.params,
                        parse: true
                    });

                if (method === 'DELETE') {
                    m.destroy({
                        success: function (model, response, options) {
                            handleTunnelSyncSuccess(model, response);
                        },
                        error: function (model, response, options) {
                            handleTunnelSyncError(model, response);
                        }
                    });
                }
                else if (method === 'NONCRUD') {
                    var fname = payload.fname,
                        args = payload.args;
                    m.call(fname, args, {
                        success: function (response) {
                            handleTunnelCallSuccess(m.ctx, response);
                        },
                        error: function (response) {
                            handleTunnelCallError(m.ctx, response);
                        }
                    });
                }
                else {
                    m.save({},
                        {
                            success: function (model, response, options) {
                                handleTunnelSyncSuccess(model, response);
                            },
                            error: function (model, response, options) {
                                handleTunnelSyncError(model, response);
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