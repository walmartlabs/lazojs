define(['underscore'], function (_) {

    'use strict';

    var subRegEx = /\{\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}\}/g;

    return {

        methodMap: {
            'create': 'POST',
            'update': 'PUT',
            'patch': 'PATCH',
            'delete': 'DELETE',
            'read': 'GET'
        },

        substitute: function (s, o) {
            return s.replace ? s.replace(subRegEx, function (match, key) {
                return _.isUndefined(o[key]) ? match : o[key];
            }) : s;
        }


    };

});