define(['l!serverFileResolver', 'underscore', 'utils/template'], function (serverFileResolver, _, template) {

    'use strict';

    return _.extend({

        getPath: function (moduleName, cmpName, moduleType) {
            var pathPrefix = moduleName.indexOf('a:') === 0 ? 'app' : '';

            moduleName = pathPrefix ? moduleName.split(':')[1] : moduleName;
            pathPrefix = pathPrefix && (moduleType === 'view' || moduleType === 'template') ?
                pathPrefix + '/views' : pathPrefix;

            return (pathPrefix ? pathPrefix : ('components/' + cmpName)) +
                (!pathPrefix && (moduleType === 'view' || moduleType === 'template') ? '/views' : '') +
                '/' + moduleName;
        },

        getBasePath: function (moduleName, cmpName, moduleType) {
            var modulePath = this.getPath(moduleName, cmpName, moduleType);
            return modulePath.substr(0, modulePath.lastIndexOf('/'));
        },

        getTemplateName: function (view) {
            return _.result(view, 'templateName') || view.name;
        },

        getTemplatePath: function (view) {
            return this.getPath(this.getTemplateName(view) + '.' + template.getTemplateExt(view.templateEngine), view.ctl.name, 'template');
        },

        // TODO: deprecated, can be removed once load_view is merged to dev
        convertTemplatePath: function (templatePath) {
            return 'tmp/' + templatePath.substr(0, templatePath.lastIndexOf('.')) + '.js';
        },

        getComponentFiles: function (components, filter) {
            var list = LAZO.files.components;
            var files = [];

            filter = filter || function () { return true; };

            for (var i = 0; i < components.length; i++) {
                for (var k in list) {
                    if (k.indexOf('components/' + components[i] + '/') === 0 && filter(k)) {
                        files.push(k);
                    }
                }
            }

            return files;
        }

    }, serverFileResolver);

});