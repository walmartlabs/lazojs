/*global define:false, LAZO:false*/

define(['jquery'], function ($) {

    var AssetsProvider = LAZO.app.assets.Provider.extend({

        list: function (options) {
            $.ajax({
                data: {
                    componentName: options.componentName
                },
                error: function (error) {
                    options.error(error);
                },
                success: function (result) {
                    options.success(result);
                },
                url: '/assets'
            });
        }

    });

    return AssetsProvider;
});
