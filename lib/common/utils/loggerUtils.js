define(['l!serverLoggerUtils'], function (serverLoggerUtils) {

    var formatter = function () {
        var args = convertArgsToArray(arguments),
            format = args.shift(),
            argsCount = args.length,
            argPos = 0;

        if (typeof format !== 'string') {
            return format;
        }

        var formatted = format.replace(/%([difjs])/g, function (match, token) {
            var arg = args[argPos++],
                argType = typeof arg;

            if (argType === 'undefined') {
                return argType;
            }

            switch (token) {
                case 'd':
                case 'i':
                    return argType === 'number' ? arg.toFixed() : arg;
                case 'f':
                    return argType === 'number' ? arg.toPrecision() : arg;
                case 'j':
                    return safeStringify(arg);
                case 's':
                    return arg;
            }
        });

        for (; argPos < argsCount; argPos++) {
            formatted += ' ' + safeStringify(args[argPos]);
        }

        return formatted;
    };

    var safeStringify = function (object) {
        try {
            if (object instanceof Error) {
                return serializeError(object);
            }

            return object && JSON.stringify(object);
        } catch (error) {
            // There might be a circular reference
            return LAZO.app && LAZO.app.isServer ? serverLoggerUtils.serverStringify(object) : object;
        }
    };

    var serializeError = function (error) {
        var e = LAZO.app && LAZO.app.isServer && error ? {
            message: error.message,
            stack: error.stack
        } : error;

        return JSON.stringify(e);
    };

    var getRequestId = function () {
        var request = LAZO.app && LAZO.app.isServer && serverLoggerUtils.getRequest();
        return (request && request.id) || '-';
    };

    var convertArgsToArray = function (args) {

        // Do not slice arguments
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments

        if (args.length === 0) {
            return [];
        }

        var array = [];
        for (var i = 0; i < args.length; i++) {
            array.push(args[i]);
        }

        return array;

    };

    return {
        formatter: formatter,
        safeStringify: safeStringify,
        serializeError: serializeError,
        getRequestId: getRequestId,
        _convertArgsToArray: convertArgsToArray
    };

});

