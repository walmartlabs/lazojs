define(function () {

    'use strict';

    var filters = {};

    return {

        get: function (path, params, ctx) {
            var i,
                redirect;

            for (var key in filters) {
                if (path.match(new RegExp(key))) {
                    var funcs = filters[key];
                    i = funcs.length;
                    while (i) {
                        if ((redirect = funcs[i-1](path, params, ctx))) {
                            return redirect;
                        }
                        i--;
                    }
                }
            }
        },

        add: function (regex, func) {
            filters[regex] = filters[regex] || [];
            filters[regex].push(func);
            return this;
        }

    };

});