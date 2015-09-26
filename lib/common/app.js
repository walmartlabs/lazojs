define(['requestFilters', 'underscore', 'utils/template', 'utils/model', 'utils/document', 'backbone', 'base', 'bundler', 'l!httpResponse', 'l!tunnelFilters'],
    function (filter, _, template, model, doc, Backbone, Base, Bundler, httpResponse, tunnelFilters) {

    'use strict';

    var bundle = new Bundler();

    var LazoApp = Base.extend({

        isClient: false,

        isServer: false,

        defaultTitle: 'lazojs',

        prefetchCss: false, // if set to true then XHR will be used to prefetch css to help prevent FOUSC

        setData: function (key, val, ctx) {
            ctx._rootCtx.data[key] = val;
            return this;
        },

        getData: function (key, ctx) {
            return ctx._rootCtx.data[key];
        },

        addRequestFilter: function (regex, func) {
            filter.add(regex, func);
            return this;
        },

        addTunnelFilter: function (tunnelFilter) {
            if (this.isClient) {
                return this;
            }

            tunnelFilters.add(tunnelFilter);
            return this;
        },

        addRoutes: function (routes) {
            LAZO.routes = LAZO.routes || {};
            _.extend(LAZO.routes, routes);
            return this;
        },

        navigate: function (ctx, routeName) {
            if (this.isClient) {
                if (routeName.match(/^(?:(ht|f)tp(s?)\:\/\/)?/)[0].length) {
                    return window.location = routeName;
                }
                LAZO.router.navigate(routeName, { trigger: true });
            } else {
                ctx._reply.redirect(routeName);
            }
        },

        loadModel: function (modelName, options) {
            model.process(modelName, options, 'model');
            return this;
        },

        loadCollection: function (collectionName, options) {
            model.process(collectionName, options, 'collection');
            return this;
        },

        createModel: function (modelName, attributes, options) {
            model.create(modelName, attributes, options, 'model');
            return this;
        },

        createCollection: function (collectionName, attributes, options) {
            model.create(collectionName, attributes, options, 'collection');
            return this;
        },

        addTag: function (name, attributes, content) {
            doc.addTag(name, attributes, content);
            return this;
        },

        addPageTag: function (ctx, name, attributes, content) {
            doc.addPageTag(ctx, this.isServer, name, attributes, content);
            return this;
        },

        getPageTags: function (ctx) {
            return doc.getPageTags(ctx, this.isServer);
        },

        setHtmlTag: function (val) {
            doc.setHtmlTag(val);
            return this;
        },

        setBodyClass: function (val) {
            doc.setBodyClass(val);
            return this;
        },

        // TODO: deprecated; remove once apps have been updated
        setTitle: function (title) {
            doc.setTitle(title);
            return this;
        },

        setDefaultTitle: function (title) {
            this.defaultTitle = title;
            return this;
        },

        registerTemplateEngine: function (engineDef, options) {
            template.loadTemplateEngine(engineDef, options);
            return this;
        },

        getTemplateEngine: function (engineName) {
            return template.getTemplateEngine(engineName);
        },

        getTemplateExt: function (engineName) {
            return template.getTemplateExt(engineName);
        },

        getDefaultTemplateEngine: function () {
            return template.getDefaultTemplateEngine();
        },

        getDefaultTemplateEngineName: function () {
            return template.getDefaultTemplateEngineName();
        },

        setDefaultTemplateEngine: function (engineName) {
            template.setDefaultTemplateEngine(engineName);
        },

        getImport: function (relativePath) {
            return bundle.resolveImport(relativePath, 'application');
        },

        addHttpHeader: function (name, value, options) {
            if (this.isClient) {
                return this;
            }

            httpResponse.addHttpHeader(name, value, options);
            return this;
        },

        getHttpHeaders: function () {
            if (this.isClient) {
                return [];
            }

            return httpResponse.getHttpHeaders();
        },

        addHttpVaryParam: function (varyParam) {
            if (this.isClient) {
                return this;
            }

            httpResponse.addVaryParam(varyParam);
            return this;
        },

        getHttpVaryParams: function () {
            if (this.isClient) {
                return [];
            }

            return httpResponse.getVaryParams();
        }

    });

    _.extend(LazoApp.prototype, Backbone.Events);

    return LazoApp;

});