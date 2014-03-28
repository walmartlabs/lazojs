define(['jquery', 'async', 'underscore'], function ($, async, _) {

    'use strict';

    var htmlTag = '',
        bodyClass = '',
        tags = [],
        tagAttributeDefaults = {
            script: {
                type: 'text/javascript',
                'lazo-application': '1'
            },
            link: {
                rel: 'stylesheet',
                type: 'text/css',
                'lazo-application': '1'
            }
        };

    return {

        setHtmlTag: function (val) {
            htmlTag = val;
            return this;
        },

        setBodyClass: function (val) {
            bodyClass = val;
            return this;
        },

        getHtmlTag: function () {
            return htmlTag;
        },

        getBodyClass: function () {
            return bodyClass;
        },

        addTag: function (name, attributes, content) {
            tags.push(this._createTag(name, attributes, content));

            if (LAZO.app.isClient) {
                this._addTagToDOM(name, attributes, content);
            }

            return this;
        },

        getTags: function () {
            return tags;
        },

        setTitle: function (title) {
            var t = _.find(tags, function (tag) { return tag.name === 'title'; }),
                $title;

            if (t) {
                t.content = title;
            } else {
                this.addTag('title', {}, title);
            }

            if (LAZO.app.isClient) {
                $title = $('title');
                if ($title.length) {
                    $title.html(title);
                } else {
                    this._addTagToDOM('title', {}, title);
                }
            }

            return this;
        },

        updateCss: function (add, remove, callback) {
            var i,
                tasks = [],
                self = this;

            this.$head = this.$head || $('head');

            for (i = 0; i < remove.length; i++) {
                this.$head.find('[href="' + remove[i] + '"]').remove();
            }

            for (i = 0; i < add.length; i++) {
                (function (i) {
                    tasks.push(function (callback) {
                        var link  = document.createElement('link'),
                            head = self.$head[0];

                        link.rel  = 'stylesheet';
                        link.type = 'text/css';
                        link.href = add[i];
                        link.onload = function () {
                            callback(null);
                        };

                        head.appendChild(link);
                    });
                })(i);
            }

            async.parallel(tasks, function (err) {
                callback();
            });
        },

        setsDefaultTitle: function (title) {
            this.defaultTitle = title;
            return this;
        },

        _createTag: function (name, attributes, content) {
            var defaults,
                attrStr;

            content = content || null;
            defaults = _.clone(tagAttributeDefaults[name] || {});
            attributes = _.extend(defaults, attributes);

            return { name: name, attributes: _.extend(defaults, attributes), content: content };
        },

        _addTagToDOM: function (name, attributes, content) {
            this.$head = this.$head || $('head');
            var attrStr = _.reduce(attributes, function(memo, val, key){
                return memo + (' ' + key + '=' + val);
            }, '');
            this.$head.append('<' + name + attrStr + '>' + (content || '') + '</' + name + '>');
        }

    };

});