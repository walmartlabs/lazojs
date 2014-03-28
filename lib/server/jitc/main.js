define(['jitc/file', 'jitc/template', 'jitc/require', 'jitc/css'], function (file, tmp, req, css) {

    'use strict';

    var path = require('path');

    return {

        compileTemplate: function (template, templateEngine) {
            return templateEngine.compile(template);
        },

        writeTemplate: function (filePath, template, templateEngineName, targetDir, callback) {
            return callback(null); // TODO: implement template precompiling
            file.expandPath(filePath, targetDir, function (err) {
                if (err) { // TODO: error handling
                    throw err;
                }
                // TODO: fixed double tmp in path
                file.write(path.normalize(targetDir + '/' + filePath), tmp.amdify(template, templateEngineName), callback);
            });
        },

        bundleJs: function (options, callback) {
            req.bundle(options, callback);
        },

        configureJsBundler: function (files, baseUrl, out) {
            return req.configure(files, baseUrl, out);
        },

        bundleCss: function (options, callback) {
            css.bundle(options, callback);
        },

        buildComponentBundleDef: function (components) {
            var bundleDefs = {};

            components.forEach(function (cmp) {
                bundleDefs[cmp.name] = {
                    css: cmp.ctx.css.map(function (cssPath) {
                        return cssPath.substr(0, 1) === '/' ? cssPath.substr(1) : cssPath;
                    }),
                    js: cmp.ctx.js
                }
            });

            return bundleDefs;
        }

    };

});