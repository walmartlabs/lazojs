define(['handlebars', 'page'], function (Handlebars, page) {

    var pageTemplate = Handlebars.templates['page.hbs'];

    return function (options) {
        return pageTemplate(options);
    };

});