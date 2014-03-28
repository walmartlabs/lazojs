define(['underscore', 'lazoModel'], function (_, Model) {

    'use strict';

    return {

        serialize: function (ctl, rootCtx) {
            var serObj = {},
                viewRef,
                omit = rootCtx ? ['cookies', '_rawReq', 'models', 'collections'] :
                    ['cookies', '_rawReq', 'models', 'collections', '_rootCtx'];

            serObj.cid = ctl.cid;
            serObj.ctx = _.omit(ctl.ctx, omit);
            serObj.ctx.models = {};
            serObj.ctx.collections = {};
            serObj.isBase = ctl.isBase;
            serObj.name = ctl.name;
            if (ctl.currentView && ctl.currentView.options) {
                viewRef = ctl.currentView.options.ref;

                serObj.currentView = {
                    cid: ctl.currentView.cid,
                    name: ctl.currentView.name,
                    ref: ctl.currentView.ref,
                    templatePath: ctl.currentView.templatePath,
                    compiledTemplatePath: ctl.currentView.compiledTemplatePath,
                    basePath: ctl.currentView.basePath,
                    isBase: ctl.currentView.isBase,
                    hasTemplate: ctl.currentView.hasTemplate
                };

                if (ctl.currentView._itemEmptyViewConstructors) { // quack i am a collection view
                    serObj.currentView._itemEmptyViewConstructors = _.map(ctl.currentView._itemEmptyViewConstructors, function (val, key) {
                        return key;
                    });

                    serObj.currentView._itemEmptyViewTemplates = _.map(ctl.currentView._itemEmptyViewTemplates, function (val, key) {
                        return { name: key, path: val.path };
                    });
                }
            }

            //children
            var serializedKids = {};
            _.each(ctl.children, function (regionChildren, region) {
                var comps = [];
                _.each(regionChildren, function (child) {
                    comps.push(child.toJSON());
                });
                serializedKids[region] = comps;
            });
            serObj.children = serializedKids;

            //models
            Model._serialize(ctl.ctx.models, serObj.ctx.models);
            Model._serialize(ctl.ctx.collections, serObj.ctx.collections);

            _.each(ctl.ctx.collections, function (value, key, list) {
                serObj.ctx.collections[key] = value._getGlobalId();
            });

            return serObj;
        },

        deserialize: function (ctl, options) {

        }

    };

});