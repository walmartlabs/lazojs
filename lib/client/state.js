define(['utils/document'], function (doc) {

    'use strict';

    return {

        get: function (url) {
            url = url || window.location.pathname + window.location.search;
            return LAZO.router.getItem(url);
        },

        set: function (cmpDef, rootCtx) {
            var url = window.location.pathname + window.location.search;
            LAZO.router.updateState(this.createStateObj(cmpDef, rootCtx), url);
        },

        getAddRemoveLinks: function () {
            return {
                add: this._getRequestCss(),
                remove: this._getRequestCss(LAZO.router.getPreviousUrl())
            };

        },

        createStateObj: function (cmpDef, rootCtx) {
            var deps = { // we only care about CSS
                css: rootCtx.dependencies.css.slice(0)
            };

            return { dependencies: deps };
        },

        _getRequestCss: function (url) {
            var request = this.get(url);
            request = request ? request.state : {};
            return request.dependencies && request.dependencies.css ?
                request.dependencies.css.slice(0) : [];
        }

    };

});