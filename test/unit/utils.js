define(['test/mocks/lazo'], function (lazo) {

    function createView(ctl, id, LazoView, _) {
        var el;
        var template = _.template('I am a template!');

        el = LAZO.app.isClient ? $('<div class="view-"' + id + '>') : null;
        return new LazoView({
            el: el,
            templateEngine: 'micro',
            template: template,
            ctl: ctl
        });
    }

    // these paths do not exist until after the intern configuration has
    // been set. requirejs will be defined at this point.
    return {

        setUpApp: function (callback) {
            requirejs(['underscore'], function (_) {
                var template = _.template('I am a template!');
                LAZO.app.getDefaultTemplateEngineName = function () {};
                LAZO.app.getTemplateEngine = function () {
                    return {
                        compile: function (template) {
                            return _.template(template);
                        },
                        execute: function (compiledTemplate, data) {
                            return compiledTemplate(data);
                        },
                        engine: _.template
                    };
                };

                callback();
            });
        },

        createCtlTree: function (callback) {
            requirejs(['lazoView', 'underscore'], function (LazoView, _) {
                var childCtl;
                var ctl = {
                    currentView: null,
                    children: {
                        foo: []
                    }
                };

                for (var i = 0; i < 3; i++) {
                    if (!i) {
                        ctl.currentView = createView(ctl, i, LazoView, _);
                        ctl.currentView.template = _.template('<div lazo-cmp-container="foo"></div>');
                        ctl.cid = i;
                        ctl.name = 'name' + i;
                        ctl.ctx = {};
                    } else {
                        childCtl = {
                            currentView: null,
                            cid: i,
                            name: 'name' + i,
                            ctx: {}
                        };
                        childCtl.currentView = createView(childCtl, i, LazoView, _);
                        ctl.children.foo.push(childCtl);
                    }
                }

                callback(ctl);
            });
        }

    };

});