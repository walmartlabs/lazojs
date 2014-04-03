define(['utils/handlebarsEngine'], function (handlebarsEngine) {

    'use strict';

    var defaultExt = {

        handlebars: 'hbs',
        micro: 'mt'

    };

    var defaultTemplateEngineName = 'handlebars',
        _engines = {
            handlebars: {
                extension: 'hbs',
                handler: handlebarsEngine,
                exp: 'Handlebars'
            }
        };

    function resolveEnginePath(engineDef) {
        if (engineDef.path) {
            return engineDef.path;
        }

        switch (engineDef.name) {
            case 'micro':
                return 'underscore';
        }
    }

    return {

        getDefaultExt: function (engineName) {
            return this.getTemplateExt() || defaultExt[engineName];
        },

        setTemplateExt: function (engineName, ext) {
            var engineDef = this.getTemplateEngineDef(engineName);
            if (engineDef) {
                engineDef.extension = ext;
            }
        },

        registerTemplateEngine: function (name, extension, handler, exp) {
            return (_engines[name] = { extension: extension, handler: handler, exp: exp });
        },

        getTemplateEngine: function (engineName) {
            var engine = _engines[engineName];
            return engine ? engine.handler : undefined;
        },

        getTemplateExt: function (engineName) {
            var engineDef = this.getTemplateEngineDef(engineName);
            return engineDef ? engineDef.extension : undefined;
        },

        getTemplateEngineDef: function (engineName) {
            return _engines[engineName];
        },

        getDefaultTemplateEngine: function () {
            return this.getTemplateEngine(defaultTemplateEngineName);
        },

        getDefaultTemplateEngineName: function () {
            return defaultTemplateEngineName;
        },

        setDefaultTemplateEngine: function (engineName) {
            var engine = _templateEngines[engineName];
            if (!engine) {
                throw new Error('Invalid template engine name, ' + engineName);
            }

            defaultTemplateEngineName = engineName;
        },

        loadTemplateEngine: function (engineDef, options) {
            var engine,
                self = this;

            options.error = options.error || function (err) { throw err; };

            if ((engine = this.getTemplateEngine(engineDef.name))) {
                options.success(engine);
            } else {
                LAZO.require([resolveEnginePath(engineDef)], function (engine) {
                    self.registerTemplateEngine(engineDef.name, engineDef.extension, engineDef.handler(engine), engineDef.exp);
                    options.success(self.getTemplateEngine(engineDef.name));
                }, function (err) {
                    options.error(err);
                });
            }
        },

        engHandlerMaker: function (engineName) {
            switch (engineName) {
                case 'micro':
                    return function (engine) {
                        return {
                            compile: function (template) {
                                return _.template(template);
                            },
                            execute: function (compiledTemplate, data) {
                                return compiledTemplate(data);
                            }
                        };
                    };
            }
        }

    };

});