define(
    [
        'jquery', 'underscore', 'rehydrate/main', 'utils/prune',
        'lib/client/state', 'utils/document', 'lib/client/prime',
        'renderer', 'context', 'utils/cmpProcessor', 'requestFilters',
        'resolver/file', 'l!viewManager', 'bundler', 'jquerycookie'
    ],
    function ($, _, rehydrate, prune, state, doc, prime, renderer, Context, cmpProcessor, filter, file, viewManager, Bundler) {

    'use strict';

    var bundle = new Bundler();
    var rootCtx = { dependencies: { modules: { css: [], js: [] } } };

    function destroy(ctl) {
        var children = ctl.children || {},
            components = renderer.getList('component', ctl),
            i = components.length;

        while (i) {
            i--;
            try {
                components[i].currentView.remove();
                components[i]._getEl().remove();
                for (var key in components[i]) {
                    if (key === 'currentView') {
                        components[i][key].el = null;
                        components[i][key].$el = null;
                    }

                    components[i][key] = null;
                    delete components[i][key];
                }
            } catch (e) {
                LAZO.logger.warn('[client.post.destroy] Error while destroying component', ctl, e);
            }
        }
    }

    return function (eventData) {

        function process(eventData, modules) {
            var cmpDef = cmpProcessor.getDef(eventData.route);
            var options = {
                params: eventData.parameters,
                _rootCtx: LAZO.ctl.ctx._rootCtx
            };
            var ctx = cmpProcessor.createCtx(options);

            filter.apply(eventData.route, eventData.parameters, ctx, function (redirect) {
                if (redirect) {
                    return LAZO.app.navigate(ctx, redirect);
                }

                cmpProcessor.process({
                    ctx: ctx,
                    def: cmpDef,
                    error: function (err) {
                        LAZO.logger.error('[client.execute]', 'Error executing component action: ' + err);
                        LAZO.error.render({
                            statusCode: '500',
                            error: 'Internal Server Error',
                            message: 'An internal server error occurred'
                        });
                        LAZO.app.trigger('navigate:application:error', eventData);
                    },
                    success: function (ctl, ctx, cmpDef) {
                        var hasLayoutChanged = !cmpDef.layout || (cmpDef.layout !== LAZO.layout);

                        var $target = $(hasLayoutChanged ? 'body' : '[lazo-cmp-container="lazo-layout-body"]');
                        var linksTypesLoaded = 0;
                        renderer.getTreeHtml(ctl, null, null, function (html) {
                            if (modules) {
                                delete ctx._rootCtx.dependencies;
                            } else {
                                var components = cmpProcessor.getComponents(hasLayoutChanged ? ctl : LAZO.ctl, []);
                                var links = {};

                                for (var i = 0; i < components.length; i++) {
                                    links[components[i].name] = { css: null, imports: null };
                                    links[components[i].name].css = file.getComponentFiles([components[i].name], function (fileName) {
                                        return fileName.substr(-4, 4) === '.css' && fileName.indexOf('/imports/') === -1;
                                    });
                                    links[components[i].name].imports = file.getComponentFiles([components[i].name], function (fileName) {
                                        return fileName.indexOf('/imports/') !== -1 && fileName.substr(-5, 5) === '.html';
                                    });
                                }

                                var cssLinks = [];
                                var importLinks = [];
                                for (var k in links) {
                                    for (var j = 0; j < links[k].css.length; j++) {
                                        cssLinks.push({
                                            'lazo-link-ctx': k,
                                            href: '/' + links[k].css[j]
                                        });
                                    }
                                    for (var l = 0; l < links[k].imports.length; l++) {
                                        importLinks.push({
                                            'lazo-link-ctx': k,
                                            href: '/' + links[k].imports[l]
                                        });
                                    }
                                }

                                cssLinks = bundle._createCSSLinks(cssLinks);
                                // remove old component css
                                ctx._rootCtx.dependencies.css = bundle._createCSSLinks(ctx._rootCtx.dependencies.css);
                                ctx._rootCtx.dependencies.css = bundle.sortCss(state.cleanUpLinkDependencies(ctx._rootCtx.dependencies.css, cssLinks));

                                importLinks = bundle._createImportLinks(importLinks);
                                ctx._rootCtx.dependencies.imports = bundle._createImportLinks(ctx._rootCtx.dependencies.imports);
                                ctx._rootCtx.dependencies.imports = bundle.sortImports(state.cleanUpLinkDependencies(ctx._rootCtx.dependencies.imports, importLinks));
                            }

                            LAZO.layout = cmpDef.layout;
                            rootCtx = _.extend({}, rootCtx, ctx._rootCtx);
                            LAZO.app.trigger('navigate:application:response', eventData);
                            LAZO.layout = cmpDef.layout;
                            state.set(rootCtx); // push state object to history
                            var css = state.getAddRemoveLinks('css'); // get add, remove css
                            var imports = state.getAddRemoveLinks('imports');
                            prime(css.add, 'css', false); // prefetch css

                            // keep dimensions, but hide content so that new css updating does not cause any display issues
                            $target.css({ 'visibility': 'hidden', 'min-height': $target.outerHeight(true) || $target.height() });

                            if (hasLayoutChanged) {
                                destroy(LAZO.ctl); // clean up previous root controller
                                delete LAZO.ctl;
                                LAZO.ctl = ctl; // assign new controller
                            } else {
                                // layout body child changed; addChild pushes to children array;
                                // remove the old child, the first element in the children array
                                destroy(LAZO.ctl.children['lazo-layout-body'][0]);
                                LAZO.ctl.children['lazo-layout-body'].shift();
                                // update layout parameters
                                _.extend(LAZO.ctl.ctx.params, ctl.ctx.params);
                                // update meta data
                                if (!LAZO.ctl.ctx.meta) {
                                    LAZO.ctl.ctx.meta = {};
                                }
                                _.extend(LAZO.ctl.ctx.meta, ctl.ctx.meta || {}); // Required for page tags
                            }

                            prune(LAZO.ctl); // remove orphaned models

                            function onLinksDone(loaded) {
                                if (loaded === 2) {
                                    if (hasLayoutChanged) {
                                        $target.remove('[lazo-cmp-container]');
                                        $target.append(html);
                                    } else {
                                        $target.html(html);
                                    }

                                    // Make it visible here, to minimize visual delay experienced by user
                                    $target.css({ 'visibility': 'visible', 'min-height': '' } );

                                    setTimeout(function () {
                                        LAZO.error.clear();
                                        viewManager.attachViews(ctl, function (err, success) {
                                            if (err) {
                                                LAZO.logger.error('[LAZO.navigate] Error attaching views', err);
                                            }

                                            doc.updatePageTags(LAZO.ctl.ctx, function (err) {
                                                if (err) {
                                                    LAZO.logger.error('[LAZO.navigate] Error updating page tags', err);
                                                }

                                                doc.setTitle(LAZO.ctl.ctx._rootCtx.pageTitle);
                                                LAZO.app.trigger('navigate:application:complete', eventData);
                                            });
                                        });
                                    }, 0);
                                }
                            }

                            doc.updateLinks(imports.add, imports.remove, 'import', function () {
                                linksTypesLoaded++;
                                onLinksDone(linksTypesLoaded);
                            });
                            doc.updateLinks(css.add, css.remove, 'css', function () {
                                linksTypesLoaded++;
                                onLinksDone(linksTypesLoaded);
                            });
                        });
                    }
                });
            });
        }

        // entry point
        (function response() {
            rootCtx = { dependencies: { modules: { css: [], js: [] } } };

            if ($.cookie('development') !== '1') {
                bundle.response(eventData.route, window.location.pathname, {
                    success: function (modules) {
                        if (modules) {
                            rootCtx.dependencies.modules = modules.js;
                            rootCtx.dependencies.css = bundle.sortCss(bundle._createCSSLinks(modules.css));
                            rootCtx.dependencies.imports = bundle.sortImports(bundle._createImportLinks(modules.imports));
                            LAZO.require(modules.js, function () {
                                process(eventData, true);
                            });
                        } else {
                            process(eventData);
                        }
                    },
                    error: function (err) {
                        throw err instanceof Error ? err : new Error(err);
                    }
                });
            } else {
                process(eventData);
            }
        })();

    };

});