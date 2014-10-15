module.exports = function (grunt) {

    var fs = require('fs');
    var path = require('path');
    var reqConf = grunt.file.readJSON('lib/common/resolver/paths.json');
    var isSecure = process.env.TRAVIS_SECURE_ENV_VARS === 'false' ? false : true;

    function getPaths(conf, env) {
        var paths = grunt.util._.extend({}, conf.common, (conf[env] || conf.client));
        for (var key in paths) {
            paths[key] = paths[key].replace('{env}', (env || 'client'));
        }

        return paths;
    }

    grunt.registerTask('configure-intern', 'Create intern configuration for runner', function () {
        var env = this.args[0] === 'client-local' ? 'client' : this.args[0];
        var paths = getPaths(reqConf, env);
        var specs = grunt.file.expand([
            'test/unit/' + env + '/**/*.js',
            'test/unit/client-server/**/*.js',
            '!**/*.skip.js'
        ]);
        specs = specs.map(function (spec) {
            return spec.substr(0, spec.lastIndexOf('.js'));
        });
        var conf = grunt.config.get('intern');
        conf[this.args[0]].options.suites = specs;
        if (!isSecure && env === 'client') {
            conf[this.args[0]].options.config = 'test/unit/conf.client.phantomjs';
        }
        grunt.config.set('intern', conf);
    });

    grunt.registerTask('test-server', ['configure-intern:server', 'intern:server']);
    grunt.registerTask('test-client', ['exec:selenium-server','configure-intern:client', 'intern:client']);
    grunt.registerTask('test-client-local', ['configure-intern:client-local', 'intern:client-local']);
    grunt.registerTask('test', ['test-server', 'test-client']);
    grunt.registerTask('test-local', ['test-server', 'test-client-local']);

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

        watch: {
            test: {
                files: ['lib/**/*.*', '!lib/vendor/**/*.*'],
                tasks: ['castle'],
                options: {
                    events: ['changed']
                }
            },
            lib: {
                files: ['lib/**/*.*', '!lib/**/server/**/*.*', '!lib/vendor/**/*.*'],
                tasks: ['requirejs']
            }
        },

        intern: {
            'client-local': {
                options: {
                    runType: 'runner',
                    config: 'test/unit/conf.client.local'
                }
            },
            client: {
                options: {
                    runType: 'runner',
                    config: 'test/unit/conf.client'
                }
            },
            server: {
                options: {
                    config: 'test/unit/conf.server'
                }
            }
        },

        exec: { 'selenium-server': 'node node_modules/selenium-server/bin/selenium &' }

    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('intern');
    grunt.loadNpmTasks('grunt-exec');
};