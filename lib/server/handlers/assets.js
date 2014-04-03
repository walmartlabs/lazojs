define(['assetsProvider'], function (AssetsProvider) {

    var assetsProvider = new AssetsProvider();
    if (LAZO.app.assets.getPlugin() === null) {
        LAZO.app.assets.setPlugin(new LAZO.app.assets.DefaultPlugin({ provider: assetsProvider }));
    }

    return function (request) {
        function onError() {
            request.reply([]);
        }

        function onSuccess(assetList) {
            request.reply(assetList);
        }

        if (!request.query) {
            return onError();
        }

        assetsProvider.list({
            componentName: request.query['componentName[]'],
            success: onSuccess,
            error: onError
        });
    };

});