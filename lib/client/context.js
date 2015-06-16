define(['lib/common/context', 'jquery', 'underscore', 'l!jquerycookie'], function (Context, $, _) {

    'use strict';

    // do not encode or decode cookie values
    $.cookie.raw = true;

    var ClientContext = Context.extend({

        constructor: function (options) {
            Context.prototype.constructor.call(this, options);

            this.location = Context.normalizeLocation(window.location);
            this.userAgent = window.navigator.userAgent;
        },

        getCookie: function (name) {
            return $.cookie(name);
        },

        setCookie: function (name, value, options) {
            $.cookie(name, value, options);
        },

        clearCookie: function (name, options) {
            $.removeCookie(name, _.extend({ path: '/' }, options));
        }

    });

    return ClientContext;

});