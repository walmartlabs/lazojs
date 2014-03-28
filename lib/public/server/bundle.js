define(['async', 'underscore', 'base', 'jitc/main'],
    function (async, _, Base, jitc) {

    'use strict';

    var path = require('path');

    function exclude(files) {
        return files.filter(function (file) {
            var match = /^(?:(ht|f)tp(s?)\:\/\/)?/.exec(file);
            return !match[0];
        });
    }

    function clean(files) {
        return files.map(function (file) {
            return file.indexOf('l!') === 0 ? file.substring(2) : file;
        });
    }

    return Base.extend({

        outBasePath: LAZO.FILE_REPO_PATH,

        minifier: 'uglify',

        out: 'bundles',

        _jitc: jitc,

        create: function (uri, modules, callback) {
            var self = this,
                tasks = {};

            this.cmpJsFiles = exclude(clean(this._uniq(this._flattenModuleList(modules.components, 'js'), modules.exclude))),
            this.cmpCssFiles = exclude(clean(this._flattenModuleList(modules.components, 'css'))),
            this.appJsFiles = exclude(clean(modules.app.js));
            this.appCssFiles = exclude(clean(modules.app.css));

            tasks.cmpJs = _.bind(this._createRequestJsBundle, this);
            tasks.cmpCss = _.bind(this._createRequestCssBundle, this);
            tasks.appJs = _.bind(this._createAppJsBundle, this);
            tasks.appCss = _.bind(this._createAppCssBundle, this);

            async.parallel(tasks, function (err, modules) {
                var js = [],
                    css = [];

                js = js.concat(modules.appJs, modules.cmpJs);
                css = css.concat(modules.appCss, modules.cmpCss);
                callback({
                    js: js,
                    css: css
                });
            });
        },

        resolveBundleUrl: function (bundle) {
            return bundle;
        },

        getLazoPath: function () {
            return LAZO.FILE_REPO_PATH;
        },

        getAppPath: function () {
            return LAZO.FILE_REPO_PATH;
        },

        getLibPath: function () {
            return '/lib/optimized/lib.js';
        },

        getConfig: function (files, baseUrl, out) {
            var conf = this._jitc.configureJsBundler(files || [], baseUrl, out);
            conf.optimize = this._getOptimize();
            return conf;
        },

        _getOptimize: function() {
            return this.minifier;
        },

        _flattenModuleList: function (list, type) {
            var modules = [];
            for (var key in list) {
                modules = modules.concat(list[key][type]);
            }

            return modules;
        },

        _uniq: function (modules, exclude) {
            return _.difference(_.uniq(modules), exclude).sort();
        },

        _createRequestJsBundle: function (callback, modules) {
            var self = this;

            this._jitc.bundleJs(this.getConfig(this.cmpJsFiles, this.outBasePath, this.out), function (err, jsBundle) {
                if (err) {
                    callback(err, null);
                }
                callback(null, [self.resolveBundleUrl('/' + jsBundle + '.js')]);
            });
        },

        _createRequestCssBundle: function (callback, modules) {
            var self = this;

            this._jitc.bundleCss({
                compiler: 'css',
                outDirBasePath: this.outBasePath,
                outDir: this.out,
                crypto: 'md5',
                files: this.cmpCssFiles,
                basePath: LAZO.FILE_REPO_PATH
            }, function (err, cssBundle) {
                if (err) {
                    callback(err, null);
                }

                callback(null, self.resolveBundleUrl(cssBundle));
            });
        },

        _createAppJsBundle: function (callback, modules) {
            var self = this,
                bundleConf = this.getConfig(this.appJsFiles, this.outBasePath, this.out);

            if (!this.appJsFiles.length) {
                return callback(null, []);
            }

            bundleConf.outFileName = 'app';
            this._jitc.bundleJs(bundleConf, function (err, jsBundle) {
                if (err) {
                    return callback(err, null);
                }
                callback(null, [self.resolveBundleUrl('/' + jsBundle + '.js')]);
            });
        },

        _createAppCssBundle: function (callback, modules) {
            var self = this;

            if (!this.appCssFiles.length) {
                return callback(null, []);
            }

            this._jitc.bundleCss({
                compiler: 'css',
                outDirBasePath: this.outBasePath,
                outDir: this.out,
                crypto: 'md5',
                files: this.appCssFiles,
                outFileName: 'app',
                basePath: LAZO.FILE_REPO_PATH
            }, function (err, cssBundle) {
                if (err) {
                    return callback(err, null);
                }

                callback(null, self.resolveBundleUrl(cssBundle));
            });
        }

    });

});