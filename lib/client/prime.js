define(['jquery'], function ($) {

    function primeCss(links, wait, callback) {
        var processed = 0,
            linkCount = links.length;

        if (!LAZO.app.prefetchCss) {
            return callback ? callback(null) : void(0);
        }

        for (var i = 0; i < linkCount; i++) {
            $.ajax({
                url: links[i],
                dataType: 'text',
                success: function () {
                    processed++;
                    if (wait && processed === linkCount && callback) {
                        callback(null);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    if (callback) {
                        callback(errorThrown);
                    }
                }
            });
        }

        if (!wait && callback) {
            callback(null);
        }
    }

    function primeJs(modules, wait, callback) {
        LAZO.require(modules, function () {
            if (wait && callback) { // combo handled
                callback();
            }
        });

        if (!wait && callback) { // not combo handled; prefetch and prime the cache
            callback(null);
        }
    }

    return function (resources, resourcesType, wait, callback) {
        if (resourcesType === 'css') {
            primeCss(resources, wait, callback);
        }
        if (resourcesType === 'js') {
            primeJs(resources, wait, callback);
        }
    };

});