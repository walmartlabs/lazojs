// HERMES, sweet llamas of the bahamas
// ----------------------------------
// v0.1.3
//
// Copyright (c)2013 Jason Strimpel
// Distributed under MIT license
define(function () {

    'use strict';

    var hermes;

    function augment(receiver, giver, exclude) {
        for (var k in giver) {
            if (!exclude || !exclude[k]) {
                receiver[k] = giver[k];
            }
        }

        return receiver;
    }

    function isRegExp(obj) {
       return Object.prototype.toString.call(obj) === '[object RegExp]';
    }

    function isFunction(thing) {
        return typeof thing === 'function';
    }

    // thank you backbone
    var optionalParam = /\((.*?)\)/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;
    var rootStripper = /^\/+|\/+$/g;
    var trailingSlash = /\/$/;

    hermes = {

        start: function (options) {
            var self = this;
            if (this._started || !window.history.pushState) {
                return this;
            }

            options = options || {};
            this._handlers = this._handlers || [];
            this._cache = this._cache || {};
            augment(this, options, { state: true, title: true });
            this.root = this.root ? ('/' + this.root + '/').replace(rootStripper, '/') : void 0;
            options.state = options.state || {};
            options.title = options.title || document.title;
            window.history.replaceState(options.state || {}, options.title, this._getUrl());
            document.title = options.title;
            this._setCacheItem(options.title, options.state);
            this._currentUrl = { pathname: window.location.pathname, search: window.location.search };
            self._backboneEvents();
            self._bindRoutes();
            setTimeout(function () {
                self._bindPopState();
            }, 0);
            this._started = true;
            return this;
        },

        getPreviousUrl: function () {
            if (!this._lastUrl) {
                return '';
            }

            return this._lastUrl.pathname + this._lastUrl.search;
        },

        stop: function () {
            window.removeEventListener('popstate', this._popstateListener);
            this._started = false;
        },

        route: function (route, name, callback) {
            var args,
                self = this,
                pathParamsKeys = route.match(/:\w*/g) || [];
            route = !isRegExp(route) ? this._routeToRegExp(route) : route;
            if (isFunction(name)) {
                callback = name;
                name = '';
            }

            this._handlers = this._handlers || []; // routes assigned before start is called
            this._handlers.unshift({ route: route, callback: function (data) {
                args = self._getParams(route, pathParamsKeys);
                if (isFunction(callback)) {
                    callback.apply(self, [window.location.pathname, args, data]);
                }
                if (self._backboneEventsAugmented) {
                    self.trigger.apply(self, ['route:' + name].concat(args, data));
                    self.trigger('route', name, args, data);
                }
            } });

            return this;
        },

        destroyRoutes: function () {
            this._handlers = [];
        },

        navigate: function (url, options) {
            var title;
            if (!window.history.pushState) { // for browsers that do not support push state
                window.location = url;
                return;
            }

            options = options || {};
            options.state = options.state || {};
            options.title = options.title || document.title;
            window.history[options.replace ? 'replaceState' : 'pushState'](options.state, options.title, url);
            document.title = options.title;
            this._setCacheItem(options.title, options.state);
            if (options.trigger === void 0 || options.trigger) {
                this._loadUrl(options.state);
            }
        },

        getItem: function (url) {
            return this._cache[url || this._getUrl()];
        },

        clearCache: function () {
            this._cache = {};
            return this;
        },

        updateState: function (state, url) {
            var item = this.getItem(url);
            this._setCacheItem(item.title, state, url);
            window.history.replaceState(state, item.title, (url || this._getUrl()));
        },

        routeNotMatched: function (routePathName) {},

        _setCacheItem: function (title, state, url) {
            var item = this._cache[url || this._getUrl()] = {
                title: title
            };

            if (this.cache) {
                item.state = state;
            }

            return this;
        },

        _getUrl: function () {
            return window.location.pathname + window.location.search;
        },

        _getParams: function (route, pathParamsKeys) {
            var match,
                pl     = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, ' ')); },
                query  = window.location.search.substring(1),
                params = {},
                pathParams;

            pathParams = route.exec(this._stripRoot(window.location.pathname)).slice(1);
            for (var i = 0; i < pathParamsKeys.length; i++) {
                params[pathParamsKeys[i].substring(1)] = pathParams[i] || null;
            }

            while ((match = search.exec(query))) {
                params[decode(match[1])] = decode(match[2]);
            }

            return params;
        },

        // thank you backbone
        _routeToRegExp: function (route) {
            route = route.replace(escapeRegExp, '\\$&')
                       .replace(optionalParam, '(?:$1)?')
                       .replace(namedParam, function(match, optional){
                         return optional ? match : '([^\/]+)';
                       })
                       .replace(splatParam, '(.*?)');
            return new RegExp('^' + route + '$');
        },

        _stripRoot: function (pathname) {
            var root;

            pathname = pathname.substring(0, 1) === '/' ? pathname.substring(1) : pathname;
            if (!this.root) {
                return pathname;
            }

            root = this.root.replace(trailingSlash, '');
            if (pathname.indexOf(root) === 0) {
                pathname = pathname.substr(root.length);
            } else {
                pathname = void 0;
            }

            return pathname;
        },

        _backboneEvents: function () {
            if (!this.Backbone || this._backboneEventsAugmented) {
                return this;
            }

            augment(this, Backbone.Events);
            this._backboneEventsAugmented = true;
            return this;
        },

        _bindPopState: function () {
            var self = this;

            this._popstateListener = window.addEventListener('popstate', function (e) {
                var item = self.getItem();
                self._loadUrl(e.state);
                document.title = item ? item.title : document.title;
            });
            return this;
        },

        _bindRoutes: function () {
            var routes;
            if (!this.routes || this._routesBound) {
                return this;
            }

            routes = isFunction(this.routes) ? this.routes() : this.routes;
            for (var k in this.routes) {
                this.route(k, this.routes[k]);
            }
            this._routesBound = true;

            return this;
        },

        _loadUrl: function (state) {
            var handlers = this._handlers,
                routePathName = this._stripRoot(window.location.pathname),
                len = handlers.length;

            state = state || {};
            for (var i = 0; i < len; i++) {
                if (handlers[i].route.test(routePathName)) {
                    handlers[i].callback(state);
                    this._lastUrl = { pathname: this._currentUrl.pathname, search: this._currentUrl.search };
                    this._currentUrl = { pathname: window.location.pathname, search: window.location.search };
                    return this;
                }
            }

            this.routeNotMatched(routePathName);
            return this;
        }

    };

    return hermes;

});