define(function () {

    var LAZO = {},
        isServer = true,
        isClient = true;

    try {
        window;
        isServer = false;
    } catch (err) {
        isClient = false;
    }

    LAZO.app = {

        isServer: isServer,

        isClient: isClient

    };

    var noop = function () {

    };

    LAZO.logger = {
        debug: noop,
        error: noop,
        info: noop,
        warn: noop
    };

    return LAZO;

});