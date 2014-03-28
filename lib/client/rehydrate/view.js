define(['lazoView', 'lazoCollectionView', 'async', 'resolver/file', 'utils/module', 'utils/template'],
    function (LazoView, LazoCollectionView, async, file, module, template) {

    'use strict';

    // loads template engine into the engine defs hash if has not already been defined
    function resolveTemplateEngine(view, callback) {
        var engineName = view.prototype.templateEngine || LAZO.app.getDefaultTemplateEngineName();
        template.loadTemplateEngine({
            name: engineName,
            handler: template.engHandlerMaker(engineName),
            exp: null,
            extension: template.getDefaultExt(engineName)
        }, {
            success: function () {
                callback(null, view);
            }
        });
    }

    // TODO: load precompiled templates
    function createLoader(modulePath, type, isBase) {
        return function (callback) {
            if (isBase) {
                return callback(null, LazoView);
            }

            modulePath = type === 'template' ? 'text!' + modulePath : modulePath;
            LAZO.require([modulePath], function (module) {
                if (type === 'view') {
                   resolveTemplateEngine(module, callback);
                } else {
                    callback(null, module);
                }

            }, function (err) {
                return callback(new Error('rehydrate createLoader LAZO.require failed for ' + modulePath + ' : ' + err.message), null);
            });
        };
    }

    return function (ctl, cmpDef, callback) {
        var viewDef,
            tasks = {},
            itemDefs,
            modulePath,
            i;

        if (!(viewDef = cmpDef.currentView)) {
            return callback();
        }

        // TODO: change viewDef.ref to viewDef.path
        tasks[viewDef.name + '_view'] = createLoader(viewDef.ref, 'view', viewDef.isBase);
        if (viewDef.hasTemplate) {
            tasks[viewDef.name + '_template'] = createLoader(viewDef.templatePath, 'template');
        }

        // collection item view constructors
        itemDefs = viewDef._itemEmptyViewConstructors;
        i = itemDefs ? itemDefs.length : 0;
        while (i) {
            i--;
            modulePath = file.getPath(itemDefs[i], ctl.name, 'view');
            tasks[itemDefs[i] + '_view'] = createLoader(modulePath, 'view');
        }

        // collection item view templates; TODO: load precompiled templates
        itemDefs = viewDef._itemEmptyViewTemplates;
        i = itemDefs ? itemDefs.length : 0;
        while (i) {
            i--;
            tasks[itemDefs[i].name + '_template'] = createLoader(itemDefs[i].path, 'template');
        }

        async.parallel(tasks, function (err, modules) {
            if (err) {
                return options.error(err);
            }

            var view,
                interval,
                widgetTasks = [];

            function loadWidgets(widgetTasks, callback) { // modelRehydrate module callback
                if (!widgetTasks.length) {
                    return callback(null);
                }

                async.parallel(widgetTasks, function (err, w) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null);
                });
            }

            function addItemViewsTemplates(modules, view, viewDef, widgetTasks) {
                var index,
                    isView,
                    moduleName;

                for (var key in modules) {
                    if (key !== viewDef.name + '_view' &&
                        key !== file.getTemplateName(view) + '_template') {
                        index = key.indexOf('_view');
                        isView = index !== -1;
                        index = isView ? index : key.indexOf('_template');
                        if (isView) {
                            module.addLoadWidgetFuncs(modules[key].prototype, ctl.ctx, widgetTasks);
                        }
                        view[isView ? '_itemEmptyViewConstructors' : '_itemEmptyViewTemplates'][key.substr(0, index)] = modules[key];
                    }
                }
            }

            ctl.currentView = view = ctl._createView(modules[viewDef.name + '_view'], viewDef);
            ctl.currentView.template = view._templateEngine.compile(modules[viewDef.name + '_template']);
            if (viewDef._itemEmptyViewConstructors) {
                view._itemEmptyViewConstructors = {};
                view._itemEmptyViewTemplates = {};
                addItemViewsTemplates(modules, view, viewDef, widgetTasks);
            }
            module.addLoadWidgetFuncs(view, ctl.ctx, widgetTasks);
            loadWidgets(widgetTasks, callback);
        });
    };

});