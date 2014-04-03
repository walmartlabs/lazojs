define(['jquery', 'underscore', 'context'], function ($, _, Context) {

    'use strict';

    function mergeCtl(receiver, giver) {
        for (var key in receiver) { // delete any props not in new ctl
            if (_.isUndefined(giver[key]) && key !== 'ctx') {
                delete receiver[key];
            }
        }
        for (key in giver) { // merge new props minus ctx
            if (key !== 'ctx') {
                receiver[key] = giver[key];
            }
        }

        for (key in receiver.ctx) {
            if (_.isUndefined(giver.ctx[key]) && key !== '_rootCtx') {
                delete receiver.ctx[key];
            }
        }
        for (key in giver.ctx) {
            if (key !== '_rootCtx') {
                receiver.ctx[key] = giver[key];
            }
        }

        return receiver;
    }

    function rehydrateRequest(response, callingCtl, eventData, options) {
        LAZO.require(['rehydrate/main', 'renderer'], function (rehydrate, renderer) {
            rehydrate(response, LAZO.ctl.ctx._rootCtx, function (ctl) {
                callingCtl._getEl().attr('lazo-cmp-id', ctl.cid); // update ctl.cid lazo attr
                mergeCtl(callingCtl, ctl);
                callingCtl._getEl().html(renderer.getHtml(callingCtl, callingCtl.currentView.cid, 'view'));
                renderer.attachViews(callingCtl);
                LAZO.app.trigger('navigate:controller:complete', eventData);
                options.success(eventData);
            });
        });
    }

    return function (callingCtl, cmpName, action, params, crumb, options) {
        var exclude = _.uniq(requirejs.getLoadedModuleNames()),
            eventData = { component: name, action: action, params: params };

        options = options || {};
        options.error = options.error || function (jqXHR, textStatus, errorThrown) {
            LAZO.error.render(JSON.parse(jqXHR.responseText));
        };
        options.success = options.success || function () {};

        LAZO.logger.debug(['client.cltNavigate'], 'Begin navigation...', cmpName, action);

        LAZO.app.trigger('navigate:controller:begin', eventData);
        $.ajax({
            type: 'POST',
            url: '/navigate',
            data: {
                name: cmpName,
                action: action,
                params: JSON.stringify(params || {}),
                crumb: crumb,
                exclude: JSON.stringify(exclude)
            },
            success: function (response) {
                var modules;
                Context.mergeRoot(LAZO.ctl.ctx._rootCtx, response.ctx._rootCtx); // merge before rehydrate
                modules = LAZO.app._getModules(response.ctx._rootCtx);

                LAZO.app.trigger('navigate:controller:response', eventData);
                if (modules.wait) { // load bundles
                    LAZO.require(modules.modules, function () {
                        rehydrateRequest(response, callingCtl, eventData, options);
                    });
                } else {
                    rehydrateRequest(response, callingCtl, eventData, options);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                LAZO.logger.debug(['client.cltNavigate'], 'Navigation error', cmpName, action, textStatus, errorThrown);
                options.error(jqXHR, textStatus, errorThrown);
                LAZO.app.trigger('navigate:controller:error', eventData);
            }
        });
    };

});