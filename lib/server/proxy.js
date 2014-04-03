define(['base', 'underscore', 'serviceProxy', 'fs', 'path'], function (Base, _, ServiceProxy, fs, path) {

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
                    sync.proxy = new ServiceProxy(model.ctx);

                    var opts = _.extend({ params: model.params || {} }, options, { model: model });

                    LAZO.logger.debug(['server.proxy.sync'], 'Calling CRUD syncher...', model.name);

                    switch (method) {
                        case 'read':
                            sync.fetch(opts);
                            break;
                        case 'create':
                            sync.add(model.attributes, opts);
                            break;
                        case 'update':
                            sync.update(model.attributes, opts);
                            break;
                        case 'delete':
                            sync.destroy(model.attributes, opts);
                            break;
                    }
                },
                error: function (err) {
                    LAZO.logger.debug(['server.proxy.sync'], 'Error calling CRUD syncher...', model.name, err);

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
                    sync.proxy = new ServiceProxy(model.ctx);

                    LAZO.logger.debug(['server.proxy.callSyncher'], 'Calling NON-CRUD syncher...', fname);

                    if (typeof(sync[fname]) === 'function') {
                        return sync[fname](args, options);
                    }

                    return options.error({error: 'Method not found in syncher: ' + fname});
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
