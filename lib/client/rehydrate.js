define(['lazoCtl', 'context', 'lazoModel', 'lazoView', 'lazoCollectionView'],
    function (LazoCtl, Context, LazoModel, LazoView, LazoCollectionView) {

    'use strict';

    var done;

    function rehydrateComponent(cmpDef, counters, callback) {
        counters.components++;
        LazoCtl.create(cmpDef.name, _.pick(cmpDef, 'name', 'isBase'), {
            success: function (ctl) {
                var children = cmpDef.children,
                    kids,
                    child;
                cmpDef.ctx._rootCtx = cmpDef._rootCtx;
                ctl.ctx = new Context(cmpDef.ctx);
                ctl.cid = cmpDef.cid;

                kids = ctl.children = {};
                for (var container in children) {
                    kids[container] = [];
                    for (var i = 0; i < children[container].length; i++) {
                        child = children[container][i];
                        rehydrateComponent(child, counters, function (ctl) {
                            rehydrate(ctl, cmpDef, counters);
                        });
                    }
                }

                callback(ctl);
            },
            error: function (err) {
                ; // TODO: error loading component
            }
        });
    }

    function rehydrateView() {

    }

    function rehydrateTemplate() {

    }

    function rehydrateWidget() {

    }

    function rehydrateModels() {

    }

    function rehydrate(ctl, cmpDef, counters) {
        counters.components--;

        // rehydrateView();
        // rehydrateTemplate();
        // rehydrateWidget();
        // rehydrateModels();

        isDone(counters);
    }

    function isDone(counters) {
        if (!counters.components && !counters.models &&
            !counters.views && !counters.templates) {

            done();
            done = void 0;
            return true;
        }

        return false;
    }

    return function (cmpDef, callback) {
        var counters = {
            components: 0,
            models: 0,
            views: 0,
            templates: 0
        };

        done = callback;

        rehydrateComponent(cmpDef, counters, function (ctl) {
            rehydrate(ctl, cmpDef, counters);
        });
    };

});