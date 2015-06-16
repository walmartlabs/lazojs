define(['underscore'], function (_) {

    'use strict';

    var httpHeaders = [],
        varyHeader = [];

    return {

        addHttpHeader: function (name, value, options) {
            httpHeaders.push({ name: name, value: value, options: options || null });
            return this;
        },

        getHttpHeaders: function () {
            return httpHeaders;
        },

        addVaryParam: function (varyParam) {
            varyHeader.push(varyParam);
            return this;
        },

        getVaryParams: function () {
            return varyHeader;
        },

        mergeHttpResponseData: function (ctl) {
            return {
                statusCode: ctl.getHttpStatusCode() || null,
                httpHeaders: httpHeaders.concat(ctl.getHttpHeaders()),
                varyParams: _.union(varyHeader, ctl.getHttpVaryParams())
            };
        },

        applyHttpResponseData: function (response, httpResponseData) {
            if (httpResponseData.statusCode) {
                response.code(httpResponseData.statusCode);
            }

            _.each(httpResponseData.httpHeaders, function (header) {
                response.header(header.name, header.value, header.options || { override: true });
            });

            _.each(httpResponseData.varyParams, function (headerName) {
                response.vary(headerName);
            });
        }

    }
});