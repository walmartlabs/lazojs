define(['lazoModel'], function (LazoModel) {

    'use strict';

    return function (ctl, rootCtx, callback) {

        LazoModel._deserialize(ctl, rootCtx, {
            success: function () {
                callback(null);
            },

            error: function (err) {
                callback(error);
            }
        });

    };

});