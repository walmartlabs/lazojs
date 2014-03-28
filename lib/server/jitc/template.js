define(['utils/template'], function (tmp) {

    'use strict';

    return {

        compile: function (template, templateEngine) {
            return templateEngine.compile(template);
        },

        amdify: function (template, templateEngineName) {
            var engineDef = tmp.getTemplateEngineDef(templateEngineName),
                moduleData = 'define([\'' + templateEngineName + '\'], function(' + engineDef.export + ') {';

            moduleData += 'return Handlebars.template(' + engineDef.handler.precompile(template);
            moduleData += ');});';
            return moduleData;
        }

    };

});