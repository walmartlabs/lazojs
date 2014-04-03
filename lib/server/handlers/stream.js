define(['hapi'], function (Hapi) {

    'use strict';

    return function (req) {
        var payload = req.payload;
        var componentName = req.params.compName;
        var callback = payload ? payload.callback : null;
        var fn_name = req.params.action;
        var _path = (componentName ? 'components/' + componentName : 'app') + '/server/utilActions';
        LAZO.require([_path], function (util) {
            var fn = util[fn_name];
            if (fn) {
                fn(req, {
                    success: function (ret) {
                        var resp = [];
                        if (callback) {
                            resp.push("<html><head><script>window.parent.");
                            resp.push(callback);
                            resp.push('(');
                        }
                        resp.push(JSON.stringify(ret));
                        if (callback) {
                            resp.push(');');
                            resp.push("</script></head><body></body></html>");
                        }
                        req.reply(resp.join(''));
                    },
                    error: function (ret, options) {
                        var error = Hapi.error.internal(ret);

                        if (options && options.statusCode) {
                            error.response.code = options.statusCode;
                        }

                        req.reply(error);
                    },
                    done: function () {
                        LAZO.logger.debug(['server.handlers.stream'], 'Handled by application...', _path);
                    }
                });
            }

        }, function (err) {
            LAZO.logger.error(['server.handlers.stream'], 'Error loading "%s" module.', _path, err);
            req.reply(err);
        });
    };

});