define(function () {

    'use strict';

    var _subRegEx = /\{\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}\}/g;
    var REGEX_QUERY_STRING = /(\(?\?.*)$/;
    var REGEX_PATH_PARAM = /:(\w+)/g;
    var REGEX_OPT_PATH_PARAM = /\(\/\{(\w+)\}(\/?)\)$/;
    var REGEX_OPT_TRAILING_SLASH = /(.*)\(\/\)$/;

    return {

        transform: function (route) {
            var routeNoTrailingSlash = null;

            route = '/' + route;
            route = route.replace(REGEX_QUERY_STRING, '');
            route = route.replace(REGEX_PATH_PARAM, '{$1}');
            route = route.replace(REGEX_OPT_PATH_PARAM, '/{$1?}$2');

            if (REGEX_OPT_TRAILING_SLASH.test(route)) {
                routeNoTrailingSlash = route.replace(REGEX_OPT_TRAILING_SLASH, '$1');
                route = routeNoTrailingSlash + '/';
            }

            return {
                routeNoTrailingSlash: routeNoTrailingSlash,
                route: route
            };
        }

    };

});