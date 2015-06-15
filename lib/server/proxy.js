define(['base',
    'underscore',
    'serviceProxy',
    'fs',
    'path',
    'tunnelFilters'],
    function (Base, _, ServiceProxy, fs, path, TunnelFilters) {

    //function getFilterOptions(sync, options) {
    //    return {
    //        success: function (model, response) {
    //            TunnelFilters.onSuccess(sync, model, response, {
    //                success: function (model, response) {
    //                    options.success(model, response);
    //                },
    //                error: function (model, response) {
    //                    options.error(model, response);
    //                }
    //            });
    //        },
    //        error: function (model, response) {
    //            TunnelFilters.onError(sync, model, response, {
    //                error: function (model, response) {
    //                    options.error(model, response);
    //                }
    //            });
    //        }
    //    };
    //}

    var Proxy = Base.extend({
        sync: function (method, options) {
            var model = this;
            var validationResp = doValidate(model);
            if (validationResp) {
                if (options.error) {
                    return options.error(validationResp);
                } else {
                    throw new Error('Error back not defined');
                }
            }

            findSyncer(model, {
                success: function (Syncher) {
                    var sync = new Syncher();
                    sync.proxy.ctx = model.ctx;
                    var params = model.params || {};

                    TunnelFilters.onRequest(sync, method, model, params, {
                        isSyncRequest: true,
                        success: function (mtd, mdl, prms) {

                            var opts = _.extend({ params: prms || {} }, _.omit(options, 'success', 'error'), TunnelFilters.getFilterOptions(sync, options), { model: mdl });

                            LAZO.logger.debug('[server.proxy.sync] Calling CRUD syncher...', mdl.name);

                            switch (mtd) {
                                case 'read':
                                    sync.fetch(opts);
                                    break;
                                case 'create':
                                    sync.add(mdl.attributes, opts);
                                    break;
                                case 'update':
                                    sync.update(mdl.attributes, opts);
                                    break;
                                case 'delete':
                                    sync.destroy(mdl.attributes, opts);
                                    break;
                            }

                        },
                        error: function (response) {
                            options.error(response); // TODO: Signature? include model?
                        }
                    });

                    // === Original ===
                    //var opts = _.extend({ params: model.params || {} }, options, { model: model });
                    //
                    //LAZO.logger.debug('[server.proxy.sync] Calling CRUD syncher...', model.name);
                    //
                    //switch (method) {
                    //    case 'read':
                    //        sync.fetch(opts);
                    //        break;
                    //    case 'create':
                    //        sync.add(model.attributes, opts);
                    //        break;
                    //    case 'update':
                    //        sync.update(model.attributes, opts);
                    //        break;
                    //    case 'delete':
                    //        sync.destroy(model.attributes, opts);
                    //        break;
                    //}
                },
                error: function (err) {
                    LAZO.logger.debug('[server.proxy.sync] Error calling CRUD syncher...', model.name, err);

                    ServiceProxy.prototype.sync.call(this, method, model, options);
                }
            });
        },

        callSyncher: function (fname, args, options) {
            var model = this;
            var validationResp = doValidate(model);
            if (validationResp) {
                if (options.error) {
                    return options.error(validationResp);
                } else {
                    throw new Error('Error back not defined');
                }
            }

            findSyncer(model, {
                success: function (Syncher) {
                    var sync = new Syncher();
                    sync.proxy.ctx = model.ctx;

                    TunnelFilters.onRequest(sync, fname, args, {}, {
                        isSyncRequest: false,
                        success: function (fname, args, params) {

                            var opts = _.extend(_.omit(options, 'success', 'error'), TunnelFilters.getFilterOptions(sync, options), { ctx: model.ctx });

                            LAZO.logger.debug('[server.proxy.callSyncher] Calling NON-CRUD syncher...', fname);

                            if (typeof(sync[fname]) === 'function') {
                                return sync[fname](args, opts);
                            }

                            return options.error({error: 'Method not found in syncher: ' + fname});
                        },
                        error: function (response) {
                            return options.error(response);
                        }
                    });


                    // === Original ===
                    //var opts = _.extend(options, { ctx: model.ctx });
                    //
                    //LAZO.logger.debug('[server.proxy.callSyncher] Calling NON-CRUD syncher...', fname);
                    //
                    //if (typeof(sync[fname]) === 'function') {
                    //    // TODO: Tunnel filter
                    //    // syncher instance, fname, args, options
                    //    return sync[fname](args, opts);
                    //}
                    //
                    //return options.error({error: 'Method not found in syncher: ' + fname});
                },
                error: function (err) {
                    return options.error({error: 'No syncher defined for model: ' + model.name});
                }
            });
        }
    });

    function doValidate(model) {
        if (!model.name) {
            return {error: 'model does not have a name'};
        }
        if (!model.ctx) {
            return {error: 'model does not have a context'};
        }
        return null;
    }

    function findSyncer(model, options) {
        var exists = fs.existsSync(path.join(LAZO.FILE_REPO_PATH, 'models', model.name, 'server', 'syncher.js'));
        if (!exists) {
            return options.error(Error("syncher.js not found for model " + model.name));
        }
        LAZO.require(['models/' + model.name + '/server/syncher'], options.success, options.error);
    }

    return Proxy;
});
