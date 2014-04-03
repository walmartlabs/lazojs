define(['resolver/requireConfigure', 'resolver/route', 'resolver/file'],
    function (requireConfigure, routeRes, file, loader) {

    'use strict';

    return {

        // requirejs config generator
        getReqConfig: function (env, options, callback) {
            requireConfigure.get(env, options, callback);
        },

        // route transformer
        transformRoute: function (route) {
            return routeRes.transform(route);
        },

        // file helpers
        isBase: function (modulePath, moduleType, callback, options) {
            return file.isBase(modulePath, moduleType, callback, options);
        },

        getPath: function (moduleName, cmpName, moduleType) {
            return file.getPath(moduleName, cmpName, moduleType);
        },

        getBasePath: function (moduleName, cmpName, moduleType) {
            return file.getBasePath(moduleName, cmpName, moduleType);
        },

        getTemplateName: function (view) {
            return file.getTemplateName(view);
        },

        getTemplatePath: function (view) {
            return file.getTemplatePath(view);
        },

        convertTemplatePath: function (templatePath) {
            return file.convertTemplatePath(templatePath);
        },

        list: function (directory, extension, callback) {
            return file.list(directory, extension, callback);
        },

        resolvePath: function (from, to) {
            return file.resolvePath(from, to);
        }

    };

});