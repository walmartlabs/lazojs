define(['context', 'utils/loader', 'handlers/utils', 'jitc/main', 'renderer', 'bundler'],
    function (Context, loader, utils, jitc, renderer, Bundler) {

        var bundle = new Bundler();

        function bundleRequest(request, ctl, ctx, assets, params, callback) {
            var rootCtx = utils.getRootCtxForReply(ctx, assets),
                cmpBundles = jitc.buildComponentBundleDef(renderer.getList('component', ctl)),
                cookies = ctx._rootCtx.cookies;

            // DO NOT COMBO HANDLE
            // callback(ctl.toJSON(true));

            // BEGIN disable combo handling
            if (cookies && cookies.development === '1') {
                return callback(ctl.toJSON(true));
            }

            bundle.create(ctl.ctx.location.path, {
                components: cmpBundles,
                app: {
                    css: LAZO.app.css,
                    js: ['app/application'].concat(LAZO.app.js)
                },
                loaded: params.exclude,
                type: 'controller_navigate',
                controller: params.name,
                action: params.action
            }, function (modules) {
                rootCtx.dependencies.modules = modules.js;
                rootCtx.dependencies.css = modules.css;
                callback(ctl.toJSON(true));
            });
            // END disable combo handling
        }

        return function (request, route) {
            var payload = request.payload,
                options = {
                    params: JSON.parse(request.payload.params),
                    cookies: utils.getCookies(request),
                    _rawReq: request
                },
                ctx = new Context(options);

            loader(request.payload.name, {
                ctx: ctx,
                action: request.payload.action,
                error: function (err) {
                    err = err instanceof Error ? err : new Error(err);
                    LAZO.logger.error(['server.handlers.ctlNavigate'], 'Error processing request %j', err);
                    throw err; // requestDomain catches error
                },
                success: function (ctl) {
                    utils.getAssets(request.payload.name, ctx, {
                        success: function (assets) {
                            utils.setAssets(ctl, assets);
                            bundleRequest(request, ctl, ctx, assets, request.payload, function (response) {
                                request.reply(response);
                            });
                        },
                        error: function (err) {
                            throw err;
                        }
                    });
                }
            });

        };

    });