define(function () {

    'use strict';

    return {

        render: function (errObj, ctl) {
            LAZO.require(['text!' + errObj.code, 'utils/template', 'underscore'], function (errTemplate, template, _) {
                var templateEngine = template.getTemplateEngine('handlebars'),
                    compiledTemplate = templateEngine.compile(errTemplate),
                    view;

                ctl = ctl || LAZO.ctl;
                view = ctl ? ctl.currentView : LAZO.ctl.currentView;
                ctl.children = {}; // remove children, so that renderer does not attempt to resolve them

                // reset properties as this should be considered to be in an error state until the server replies with 200
                _.extend(view, errObj);
                view.templateEngine = 'handlebars';
                view._templateEngine = templateEngine;
                view.template = compiledTemplate;
                view.render();
            });
        }

    };

});