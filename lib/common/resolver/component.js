define(['underscore', 'resolver/file'], function (_, file) {

    'use strict';

    return {

        getDef: function (route) {
            var defaultLayout = LAZO.app.defaultLayout;
            var def = LAZO.routes[route];
            var isObj;
            var name = (isObj = _.isObject(def)) ? def.component : def;
            var compParts = name.split('#');
            var action;
            var layout;

            name = compParts.length ? compParts[0] : name;
            action = compParts.length && compParts[1] ? compParts[1] : 'index';
            // possible scenarios
            // 1. no layout: def is a string, e.g. foo#baz, foo
            // 2. layout: def is an object with a layout
            // 3. default layout and layout: def is an object, app has a default layout
            // 4. default layout and layout === false: def is an object, app has a default layout, but route def def.layout = false
            layout = (isObj && def.layout) ? def.layout : (defaultLayout && !isObj || isObj && !_.isBoolean(def.layout)) ?
                defaultLayout : null;

            return _.extend({}, isObj ? def : {}, {
                name: name,
                action: action,
                layout: layout
            });
        },

        getLinks: function (cmpName, type) {
            return file.getComponentFiles([cmpName], function (link) {
                if (type === 'css') {
                    return link.substr(-4, 4) === '.css' && link.indexOf('/imports/') === -1;
                } else {
                    return link.indexOf('/imports/') !== -1 && link.substr(-5, 5) === '.html';
                }
            });
        }

    };

});
