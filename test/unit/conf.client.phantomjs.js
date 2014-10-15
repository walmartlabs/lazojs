define(['intern/dojo/text!lib/common/resolver/paths.json', 'test/mocks/lazo'], function (paths, lazo) {

    'use strict';

    paths = JSON.parse(paths);

    try {
        window.LAZO = lazo;
    } catch (err) {
        global.LAZO = lazo;
    }
    LAZO.app.isServer = false;
    LAZO.app.isClient = true;

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

        tunnel: 'NullTunnel',

        environments: [{ browserName: 'phantomjs' }],

        excludeInstrumentation: /^(?:test|node_modules|lib\/vendor)\//,

        useLoader: {
            'host-browser': '../../node_modules/requirejs/require.js'
        },

        loader: {
            paths: paths.common,
            map: {
                intern: {
                    dojo: 'intern/node_modules/dojo',
                    chai: 'intern/node_modules/chai/chai'
                },
                '*': {
                    // testing libs
                    sinon: '../../node_modules/sinon/lib/sinon.js',
                    'sinon-chai': '../../node_modules/sinon-chai/lib/sinon-chai.js'
                }
            }
        },

        webdriver: {
            host: 'localhost',
            port: 4444
        },

        useSauceConnect: false

    };

});