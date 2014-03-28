define(['jquery', 'underscore', 'rehydrate/main', 'lib/client/state', 'utils/document', 'lib/client/prime', 'renderer', 'context'],
    function ($, _, rehydrate, state, doc, prime, renderer, Context) {

        'use strict';

        function destroy(ctl) {
            var children = ctl.children || {},
                components = renderer.getList('component', ctl),
                i = components.length;

            while (i) {
                i--;
                try {
                    renderer.cleanupView(components[i].currentView);
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
                    LAZO.logger.error(['client.post.destroy'], 'Error while destroying component', ctl, e);
                }
            }
        }

        return function (eventData) {
            LAZO.logger.debug(['client.post'], 'Posting event...', eventData);

            $.ajax({
                type: 'POST',
                url: window.location, // this is updated during the push state
                dataType: 'json',
                contentType: 'application/json',
                processData: false,
                data: JSON.stringify({
                    _lazo: {
                        exclude: _.uniq(requirejs.getLoadedModuleNames()),
                        layout: LAZO.layout
                    },
                    crumb: LAZO.app._getCrumb()
                }),
                error: function (jqXHR, textStatus, errorThrown) {
                    LAZO.logger.debug(['client.post.error'], 'Error posting event', eventData, textStatus, errorThrown);
                    LAZO.error.render(JSON.parse(jqXHR.responseText));
                    LAZO.app.trigger('navigate:application:error', eventData);
                },
                success: function (response) {

                    if (response.redirect) {
                        window.location = response.redirect;
                        return;
                    }

                    var rootCtx = response.root,
                        cmpDef = response.component,
                        css,
                    // either layout has been removed, added, changed, or there was and is not a layout
                        hasRootCtlChanged = LAZO.layout !== response.layout || (!LAZO.layout && !response.layout),
                        modules = rootCtx.dependencies.modules ? rootCtx.dependencies.modules : rootCtx.modules,
                        wait = rootCtx.dependencies.modules ? true : false;

                    LAZO.app.trigger('navigate:application:response', eventData);

                    if (hasRootCtlChanged) {
                        LAZO.layout = response.layout;
                    }

                    LAZO.crumb = rootCtx.cookies.crumb; // reset crumb
                    state.set(cmpDef, rootCtx); // push state object to history
                    css = state.getAddRemoveLinks(); // get add, remove css
                    prime(css.add, 'css', false); // prefetch css
                    // if rootCtx.dependencies.modules then combo handled and we need to wait on response
                    // else prefetch modules so that they are loading in parallel while rehydrate runs
                    prime(modules, 'js', wait, function (err) {
                        if (err) {
                            return; // TODO: throw error
                        }

                        Context.mergeGlobalModels(rootCtx, LAZO.ctl.ctx._rootCtx);
                        rehydrate(cmpDef, rootCtx, function (ctl) {
                            var $target = $('body'),
                                html = renderer.getHtml(ctl);

                            destroy(LAZO.ctl); // clean up previous root controller
                            delete LAZO.ctl;
                            LAZO.ctl = ctl; // assign new controller

                            // keep dimensions, but hide content so that new css updating does not cause any display issues
                            $target.css({ 'visibility': 'hidden' });
                            doc.updateCss(css.add, css.remove, function () {
                                $target.html(html);
                                setTimeout(function () {
                                    $target.css({ 'visibility': 'visible'});
                                    renderer.attachViews(ctl);
                                    doc.setTitle(LAZO.ctl.ctx._rootCtx.pageTitle);
                                    LAZO.app.trigger('navigate:application:complete', eventData);
                                }, 0);
                            });
                        });
                    });
                }
            });
        };

    });