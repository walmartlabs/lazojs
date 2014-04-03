/*global define:false, $:false*/

define(['handlebars'], function (Handlebars) {

    return {
        compile: function(template) {
            return Handlebars.compile(template);
        },
        precompile: function (template) {
            return Handlebars.precompile(template);
        },
        execute: function(template, context, templateName) {
            return template(context);
        }
    };
});
