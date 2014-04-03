module.exports = function (grunt) {

    var fs = require('fs'),
        path = require('path'),
        reqConf = JSON.parse(fs.readFileSync('lib/common/resolver/paths.json', 'utf8'));

    function getPaths(conf, env) {
        var paths = grunt.util._.extend({}, conf.common, (conf[env] || conf.client));
        for (var key in paths) {
            paths[key] = paths[key].replace('{env}', (env || 'client'));
        }

        return paths;
    }

    grunt.registerTask('merge-mocks', 'Merge lazo mocks.', function () {
        var dst = grunt.config.get('castle').lazo.options.mocks.baseUrl,
            src = './node_modules/lazo-mocks';

        fs.readdirSync('./node_modules/lazo-mocks').forEach(function (mock) {
            if (path.extname(mock) === '.js') {
                grunt.file.copy(path.normalize(src + '/' + mock), path.normalize(dst + '/' + mock));
            }
        });
    });

    grunt.initConfig({

        requirejs: {
            compile: {
                options: {
                    include: reqConf.lib,
                    paths: getPaths(reqConf),
                    shim: {
                        handlebars: {
                            exports: 'Handlebars'
                        }
                    },
                    map: {
                        '*': {
                            'l': '/lib/client/loader.js'
                        }
                    },
                    outFileName: 'lib',
                    baseUrl:  path.resolve('.'),
                    optimize: 'uglify2',
                    logLevel: 4,
                    out: 'lib/optimized/lib.js'
                }
            }
        },

        castle: {

            lazo: {

                options: {

                    mocks: {
                        baseUrl: 'test/mocks'
                    },

                    specs: {
                        baseUrl: 'test/specs',
                        client: 'client/**/*.js',
                        server: 'server/**/*.js',
                        common: 'shared/**/*.js',
                        'client-target': 'test/specs/html'
                    },

                    requirejs: {
                        server: {
                            baseUrl: './',
                            paths: getPaths(reqConf, 'server')
                        },
                        client: {
                            baseUrl: './',
                            paths: getPaths(reqConf, 'client')
                        }
                    },

                    reporting: {
                        dest: 'reports',
                        src: 'lib',
                        options: {},
                        analysis: {
                            files: ['lib/**/*.js', '!lib/vendor/**']
                        },
                        coverage: {
                            dest: 'lib-cov',
                            exclude: 'vendor'
                        }
                    }

                }

            }

        }

    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-castle');

};