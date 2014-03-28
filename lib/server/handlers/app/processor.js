define(['underscore', 'context', 'utils/loader', 'requestFilters', 'renderer', 'handlers/app/html', 'utils/document', 'bundler', 'jitc/main', 'handlers/utils'],
    function (_, Context, loader, filter, renderer, html, doc, Bundler, jitc, utils) {

    'use strict';

    var bundle = new Bundler();

    return {

        reply: function (path, params, options) {
            var self = this,
                redirect,
                cmpDef,
                ctx,
                hasLayoutChanged,
                cmpToLoad;

            function onError(err) {
                return options.error(err);
            }

            ctx = new Context(params);
            if ((redirect = filter.get(path, params, ctx))) {
                if (ctx.isXHR) {
                    // TODO: see if this can be reworked, it's implemented as a work around for the cross origin access issue
                    return options.success({redirect: redirect});
                }
                else {
                    return LAZO.app.navigate(ctx, redirect);
                }
            }

            cmpDef = this._getCmpDef(params.svr._routes[path], LAZO.app.defaultLayout);
            hasLayoutChanged = cmpDef.layout && cmpDef.layout !== params.layout;
            cmpToLoad = cmpDef.layout || cmpDef.name;
            loader(cmpToLoad, {
                ctx: ctx,
                action: cmpToLoad === cmpDef.layout ? 'index' : cmpDef.action,
                error: onError,
                success: function (ctl) {
                    if (cmpDef.layout) {
                        ctl.addChild('lazo-layout-body', cmpDef.name, {
                            params: ctx.params,
                            action: cmpDef.action,
                            success: function () {
                                return utils.getAssets(cmpDef.name, ctx, {
                                    success: function (assets) {
                                        utils.setAssets(ctl, assets);
                                        self._buildReply(ctl, ctx, params, assets, cmpDef, options);
                                    },
                                    error: onError
                                });
                            },
                            error: onError
                        });
                    } else {
                        return utils.getAssets(cmpDef.name, ctx, {
                            success: function (assets) {
                                utils.setAssets(ctl, assets);
                                self._buildReply(ctl, ctx, params, assets, cmpDef, options);
                            },
                            error: onError
                        });
                    }
                }
            });
        },

        _buildReply: function (ctl, ctx, params, assets, cmpDef, options) {
            var cookies = ctx._rootCtx.cookies,
                self = this,
                response;

            function buildHtmlResponse(rootCtx) {
                var link,
                    i,
                    tags;

                    doc.setTitle(ctl.getPageTitle());
                    tags = _.map(doc.getTags(), function (tag) {
                        return _.clone(tag);
                    });

                function getPaths() {
                    var errTempPaths = {};

                    _.each(LAZO.errorTemplates, function (tmpDef, key) {
                        errTempPaths['' + key] = tmpDef.client;
                    });

                    return _.extend(LAZO.contexts.app.paths || {}, errTempPaths);
                }

                return html({
                    layout: cmpDef.layout || '',
                    body: renderer.getHtml(ctl),
                    rootCtl: ctl.serialize(),
                    rootCtx: JSON.stringify(rootCtx),
                    dependencies: ctx._rootCtx.dependencies,
                    tags: tags,
                    htmlTag: doc.getHtmlTag(),
                    bodyClass: doc.getBodyClass(),
                    // DO NOT COMBO HANDLE
                    // lib: false,
                    // BEGIN disable combo handling
                    lib: cookies && cookies.development === '1' ? false : bundle.getLibPath(),
                    // END disable combo handling
                    shim: JSON.stringify(LAZO.contexts.app.shim || {}),
                    paths: JSON.stringify(getPaths()),
                    args: LAZO.app.args ? JSON.stringify(LAZO.app.args) : '{}'
                });
            }

            function buildJsonResponse(rootCtx) {
                return {
                    root: rootCtx,
                    component: ctl.toJSON(),
                    layout: cmpDef.layout
                };
            }

            // entry point
            (function (self) {
                var rootCtx = utils.getRootCtxForReply(ctx, assets),
                    cmpBundles = jitc.buildComponentBundleDef(renderer.getList('component', ctl));

                // DO NOT COMBO HANDLE
                // ctx._rootCtx.dependencies.css = LAZO.app.css.slice(0).concat(ctx._rootCtx.dependencies.css);
                // return options.success(ctx.isXHR ? buildJsonResponse(rootCtx) : buildHtmlResponse(rootCtx));

                // BEGIN disable combo handling
                if (cookies && cookies.development === '1') {
                    ctx._rootCtx.dependencies.css = LAZO.app.css.slice(0).concat(ctx._rootCtx.dependencies.css);
                    return options.success(ctx.isXHR ? buildJsonResponse(rootCtx) : buildHtmlResponse(rootCtx));
                }

                bundle.create(ctl.ctx.location.path, {
                    components: cmpBundles,
                    app: {
                        css: LAZO.app.css,
                        js: ['app/application'].concat(LAZO.app.js)
                    },
                    loaded: params.exclude,
                    type: 'application_navigate',
                    controller: cmpDef.name,
                    action: cmpDef.action
                }, function (modules) {
                    rootCtx.dependencies.modules = modules.js;
                    rootCtx.dependencies.css = modules.css;
                    options.success(ctx.isXHR ? buildJsonResponse(rootCtx) : buildHtmlResponse(rootCtx));
                });
                // END disable combo handling

            })(this);
        },

        _include: function (rootCtx, exclude, isXHR) {
            return _.difference(_.uniq(rootCtx.modules), exclude).sort();
        },

        _getCmpDef: function (comp, defaultLayout) {
            var isObj,
                name = (isObj = _.isObject(comp)) ? comp.component : comp,
                compParts = name.split('#'),
                action,
                layout;

            name = compParts.length ? compParts[0] : name;
            action = compParts.length && compParts[1] ? compParts[1] : 'index';
            // possible scenarios
            // 1. no layout: comp is a string, e.g. foo#baz, foo
            // 2. layout: comp is an object with a layout
            // 3. default layout and layout: comp is an object, app has a default layout
            // 4. default layout and layout === false: comp is an object, app has a default layout, but route def comp.layout = false
            layout = (isObj && comp.layout) ? comp.layout : (defaultLayout && !isObj || isObj && !_.isBoolean(comp.layout)) ?
                defaultLayout : null;

            return {
                name: name,
                action: action,
                layout: layout
            };
        },

        _hasLayoutChanged: function () {
            return LAZO.app.isClient && window.rootCtl && layout === window.rootCtl.name ? false : true;
        }

    };

});
