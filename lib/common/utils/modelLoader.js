define(['lazoModel', 'lazoCollection'], function (LazoModel, LazoCollection) {
    'use strict';

    var modelLoader = function (name, type, cb) {
        LAZO.require(['models/' + name + '/' + type],
            function (model) {
                // https://github.com/jrburke/requirejs/issues/922
                if (typeof model === 'function') {
                    cb(model);
                }
            },
            function (err) {
                cb(type === 'model' ? LazoModel : LazoCollection, true);
            }
        );
    };

    return modelLoader;
});