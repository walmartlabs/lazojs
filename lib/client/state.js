define(['utils/document'], function (doc) {

    'use strict';

    return {

        get: function (url) {
            url = url || window.location.pathname + window.location.search;
            return LAZO.router.getItem(url);
        },

        set: function (rootCtx) {
            var url = window.location.pathname + window.location.search;
            LAZO.router.updateState(this.createStateObj(rootCtx), url);
        },

        getAddRemoveLinks: function (type) {
            return {
                add: this._getRequestLinks(type),
                remove: this._getRequestLinks(type, LAZO.router.getPreviousUrl())
            };
        },

        _getRequestLinks: function (type, url) {
            var request = this.get(url);
            request = request ? request.state : {};
            return request.dependencies && request.dependencies[type] ?
                request.dependencies[type].slice(0) : [];
        },

        createStateObj: function (rootCtx) {
            var deps = { // we only care about CSS
                css: rootCtx.dependencies.css.slice(0),
                imports: rootCtx.dependencies.imports.slice(0)
            };

            return { dependencies: deps };
        },

        cleanUpLinkDependencies: function (links, cmpLinks) {
            var cleanList = [];

            for (var i = 0; i < links.length; i++) {
                if (links[i].href.indexOf('/components/') !== 0) {
                    cleanList.push(links[i]);
                }
            }

            return cleanList.concat(cmpLinks);
        }

    };

});