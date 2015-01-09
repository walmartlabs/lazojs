A utility class that can be used to call service endpoints.
This is exposed with the `proxy` property on the [LazoSyncher](LazoSyncher.md#proxy)

```js
define(['lazoSyncher'], function (LazoSyncher) {

    return LazoSyncher.extend({

        fetch: function(options){
            // Do some async get
            this.proxy.get('http://path/to/model', {
                params: options.params,
                success: function(response){
                    options.success(response);
                },
                error: function(error){
                    options.error(error);
                }
            });

        };

    });

});
```

### `get(svc, options)`

Use to send a `GET` request to a service.

#### Arguments
1. `svc` *(String)*: The url for a given service endpoint.
1. `options` *(Object)*: Options hash.
    - `success` *(Function)*: Callback function to be called when fetch succeeds, passed `response` as argument.
    - `error` *(Function)*: Callback function to be called when fetch fails, passed `response` as argument.
    - `[params]` *(Object)*: A hash containing name-value pairs used in url substitution.
    - `[headers]` *(Object)*: A hash containing name-value pairs of headers to be sent to the service.
    - `[raw]` *(Boolean)*: A boolean that if set to true will return a unparsed response. Defaults to `false`.

#### Example
```js
define(['lazoSyncher'], function (LazoSyncher) {

    return LazoSyncher.extend({

        fetch: function(options){
            var svc = 'path/to/service/{{id}}'
            var options = {
                params: {
                    id: 1
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                success: function(response){
                    options.success(response);
                },
                error: function(error){
                    options.error(error);
                }
            };

            this.proxy.get(svc, options);

        };

    });

});
```

### `post(svc, attributes, options)`

Use to send a `POST` request to a service.

#### Arguments
1. `svc` *(String)*: The url for a given service endpoint.
1. `attributes` *(Object)*: A hash containing name-value pairs used to be sent as the payload to the server.
1. `options` *(Object)*: Options hash.
    - `success` *(Function)*: Callback function to be called when fetch succeeds, passed `response` as argument.
    - `error` *(Function)*: Callback function to be called when fetch fails, passed `response` as argument.
    - `[params]` *(Object)*: A hash containing name-value pairs used in url substitution.
    - `[headers]` *(Object)*: A hash containing name-value pairs of headers to be sent to the service.
    - `[raw]` *(Boolean)*: A boolean that if set to true will return a unparsed response. Defaults to `false`.

#### Example
```js
define(['lazoSyncher'], function (LazoSyncher) {

    return LazoSyncher.extend({

        add: function(options){
            var svc = 'path/to/service'
            var attributes = {
                name: 'Name'
            };
            var options = {
                params: attributes,
                headers: {
                    'Content-Type': 'application/json'
                },
                success: function(response){
                    options.success(response);
                },
                error: function(error){
                    options.error(error);
                }
            };

            this.proxy.post(svc, attributes, options);

        };

    });

});
```

### `put(svc, attributes, options)`

Use to send a `PUT` request to a service.

#### Arguments
1. `svc` *(String)*: The url for a given service endpoint.
1. `attributes` *(Object)*: A hash containing name-value pairs used to be sent as the payload to the server.
1. `options` *(Object)*: Options hash.
    - `success` *(Function)*: Callback function to be called when fetch succeeds, passed `response` as argument.
    - `error` *(Function)*: Callback function to be called when fetch fails, passed `response` as argument.
    - `[params]` *(Object)*: A hash containing name-value pairs used in url substitution.
    - `[headers]` *(Object)*: A hash containing name-value pairs of headers to be sent to the service.
    - `[raw]` *(Boolean)*: A boolean that if set to true will return a unparsed response. Defaults to `false`.

#### Example
```js
define(['lazoSyncher'], function (LazoSyncher) {

    return LazoSyncher.extend({

        update: function(options){
            var svc = 'path/to/service/{{id}}'
            var attributes = {
                name: 'Name',
                id: 1
            };
            var options = {
                params: attributes,
                headers: {
                    'Content-Type': 'application/json'
                },
                success: function(response){
                    options.success(response);
                },
                error: function(error){
                    options.error(error);
                }
            };

            this.proxy.put(svc, attributes, options);

        };

    });

});
```

### `destroy(svc, attributes, options)`

Use to send a `DELETE` request to a service.

#### Arguments
1. `svc` *(String)*: The url for a given service endpoint.
1. `attributes` *(Object)*: A hash containing name-value pairs used to be sent as the payload to the server.
1. `options` *(Object)*: Options hash.
    - `success` *(Function)*: Callback function to be called when fetch succeeds, passed `response` as argument.
    - `error` *(Function)*: Callback function to be called when fetch fails, passed `response` as argument.
    - `[params]` *(Object)*: A hash containing name-value pairs used in url substitution.
    - `[headers]` *(Object)*: A hash containing name-value pairs of headers to be sent to the service.
    - `[raw]` *(Boolean)*: A boolean that if set to true will return a unparsed response. Defaults to `false`.

#### Example
```js
define(['lazoSyncher'], function (LazoSyncher) {

    return LazoSyncher.extend({

        destroy: function(options){
            var svc = 'path/to/service/{{id}}'
            var attributes = {
                name: 'Name',
                id: 1
            };
            var options = {
                params: attributes,
                headers: {
                    'Content-Type': 'application/json'
                },
                success: function(response){
                    options.success(response);
                },
                error: function(error){
                    options.error(error);
                }
            };

            this.proxy.destroy(svc, attributes, options);

        };

    });

});
```
