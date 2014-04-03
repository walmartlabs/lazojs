define(['lazoCtl', 'context', 'rehydrate/view', 'rehydrate/model'],
    function (LazoCtl, Context, rehydrateView, rehydrateModels) {

    'use strict';

    var done,
        rootCtl;

    function rehydrateComponent(cmpDef, counters, callback) {
        counters.components++;
        LazoCtl.create(cmpDef.name, _.pick(cmpDef, 'name', 'isBase'), {
            success: function (ctl) {
                var children = cmpDef.children,
                    kids;
                cmpDef.ctx._rootCtx = cmpDef._rootCtx;
                ctl.ctx = new Context(cmpDef.ctx);
                ctl.cid = cmpDef.cid;

                kids = ctl.children = {};
                for (var container in children) {
                    (function (container) {
                        kids[container] = [];
                        for (var i = 0; i < children[container].length; i++) {
                            (function (i) {
                                var child = children[container][i];
                                child._rootCtx = cmpDef._rootCtx;
                                rehydrateComponent(child, counters, function (ctl) {
                                    kids[container][i] = ctl;
                                    rehydrate(ctl, child, counters);
                                });
                            })(i);
                        }
                    })(container);
                }
                callback(ctl);
            },
            error: function (err) {
                ; // TODO: error loading component
            }
        });
    }

    function rehydrate(ctl, cmpDef, counters) {
        counters.components--;
        counters.models++;

        rehydrateModels(ctl, cmpDef.ctx._rootCtx, function () {
            counters.models--;
            counters.views++;
            // views are dependent on models & collections so views cannot load in parellel;
            // we could get clever, setInterval and catch errors, but there is no way to determine
            // what is causing the type error, so it would not be a reliable approach; additionally,
            // in production these will be combo handled so it will not have a big impact on performance
            rehydrateView(ctl, cmpDef, function () {
                counters.views--;
                isDone(counters);
            });
            isDone(counters);
        });

        isDone(counters);
    }

    function isDone(counters) {
        if (!counters.components && !counters.models &&
            !counters.views) {
            done(rootCtl);
            done = void 0;
            rootCtl = void 0;
            return true;
        }

        return false;
    }

    return function (cmpDef, ctx, callback) {
        var counters = {
            components: 0,
            models: 0,
            views: 0
        };

        done = callback;
        cmpDef._rootCtx = ctx;
        rehydrateComponent(cmpDef, counters, function (ctl) {
            rootCtl = ctl;
            rehydrate(ctl, cmpDef, counters);
        });
    };

});