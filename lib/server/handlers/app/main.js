define(['handlers/utils', 'handlers/app/processor'], function (utils, processor) {

    return function (request, route, svr) {
        var payload = request.payload,
            params = {
                params: utils.getParams(request),
                cookies: utils.getCookies(request),
                _rawReq: request,
                svr: svr,
                headers: utils.getHeaders(request),
                url: utils.getParsedUrl(request)
            };

        if (payload && payload._lazo) {
            params.exlcude = payload._lazo.exclude;
            params.layout = payload._lazo.layout;
        }

        LAZO.logger.debug(['server.handlers.app.main.processor.reply'], 'Processing route request...', route, params);

        processor.reply(route, params, {
            error: function (err) {
                err = err instanceof Error ? err : new Error(err);
                LAZO.logger.error(['server.handlers.app.main.processor.reply'], 'Error processing request...', route, params, err);
                throw err; // hapi domain catches error
            },
            success: function (response) {
                request.reply(response);
            }
        });

    };

});