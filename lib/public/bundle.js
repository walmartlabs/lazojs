define(['underscore', 'base', 'resolver/component', 'jquery'], function (_, Base, cmpResolver, $) {

    'use strict';

    var supportsImports = (function () {
        return LAZO.isClient && 'import' in document.createElement('link');
    })();

    return Base.extend({

        response: function (route, uri, options) {
            options.success(null);
        },

        getLibPath: function () {
            return LAZO.conf.libPath;
        },

        resolveBundleUrl: function (bundle) {
            return bundle;
        },

        getComponentDef: function (route) {
            return cmpResolver.getDef(route);
        },

        getComponentCss: function (name) {
            return cmpResolver.getLinks(name, 'css');
        },

        // TODO: deprecate next major
        getComponentCSS: function (name) {
            return cmpResolver.getLinks(name, 'css');
        },

        getComponentImports: function (name) {
            return cmpResolver.getLinks(name, 'import');
        },

        sortCss: function (links) {
            return links;
        },

        sortImports: function (links) {
            return links;
        },

        resolveImport: function (relativePath, namespace) {
            if (LAZO.app.isServer) {
                LAZO.logger.warn('bundle.resolveImport', 'Cannot call on server.');
                return null;
            }

            var path = namespace === 'application' ? relativePath :
                'components/' + namespace + '/imports/' + relativePath;
            var $import = $('link[href*="' + path + '"][lazo-link-ctx="' + namespace + '"]');
            var linkNode = $import[0];

            return linkNode ? (supportsImports ? linkNode.import : linkNode) : null;
        },

        _createLink: function (link, defaults) {
            if (_.isString(link)) {
                return _.extend({ href: link }, defaults);
            } else {
                return _.extend(defaults, link);
            }
        },

        _createCSSLink: function (link) {
            return this._createLink(link, {
                rel: 'stylesheet',
                type: 'text/css',
                'lazo-link': 'css',
                'lazo-link-ctx': 'application'
            });
        },

        _createCSSLinks: function (links) {
            return _.map(links, _.bind(this._createCSSLink, this));
        },

        _createImportLink: function (link) {
            return this._createLink(link, {
                rel: 'import',
                'lazo-link': 'import',
                'lazo-link-ctx': 'application'
            });
        },

        _createImportLinks: function (links) {
            return _.map(links, _.bind(this._createImportLink, this));
        }

    });

});