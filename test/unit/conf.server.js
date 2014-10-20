define(['intern/dojo/text!lib/common/resolver/paths.json', 'test/mocks/lazo'], function (paths, lazo) {

    'use strict';

    paths = JSON.parse(paths);

    try {
        window.LAZO = lazo;
    } catch (err) {
        global.LAZO = lazo;
    }
    LAZO.app.isServer = true;
    LAZO.app.isClient = false;
    LAZO.isServer = true;
    LAZO.isClient = false;

    var needle = '/{env}/';
    var serverPaths = {};
    var env = LAZO.app.isServer ? 'server' : 'client';
    var replace = '/' + env + '/';

    for (var k in paths.common) { // update env specific implementation paths
        paths.common[k] = paths.common[k].replace(needle, replace);
    }
    for (k in paths[env]) { // merge env specific paths
        paths.common[k] = paths[env][k];
    }

    return {

        excludeInstrumentation: /^(?:test|node_modules|lib\/vendor)\//,

        useLoader: {
            'host-node': 'requirejs',
        },

        loader: {
            paths: paths.common,
            map: {
                intern: {
                    dojo: 'intern/node_modules/dojo',
                    chai: 'intern/node_modules/chai/chai'
                },
                '*': {
                    // mocks
                    request: 'test/mocks/server/request',
                    'continuation-local-storage': 'test/mocks/server/continuation-local-storage',
                    hapi: 'test/mocks/server/hapi'
                }
            }
        }

    };

});