The LazoSyncher is a server only concept in Lazo that allows developers to execute
server side methods from models and collections on the client and server.

By extending the Syncher class developers are able write code that can directly
interact with any data store.  All methods on the Syncher are expected to be asynchronous.

If a Syncher exists it will be used by the framework to back a [LazoModel](LazoModel.md) or [LazoCollection](LazoCollection.md).
Essentially becoming the sync for the model or collection.

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

### `fetch(options)`

The fetch method will be called when the LAZO.app's or LazoController's loadModel or loadCollection method is executed
or manually from a model or collections instance using `model.fetch`.

#### Arguments
1. `options` *(Object)*: The options specified in a call to `loadModel`, `loadCollection` or `fetch`.
    - `success` *(Function)*: Callback function to be called when fetch succeeds, passed `response` as argument.
    - `error` *(Function)*: Callback function to be called when fetch fails, passed `response` as argument.

#### Example
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

### `add(attributes, options)`

The add method will be called when the LAZO.app's or LazoController's create method is executed
or manually from a model or collections instance using `model.save`.

#### Arguments
1. `arguments` *(Object)*: A hash of the model's state that will be the attributes a new model.
1. `options` *(Object)*: The options specified in a call to a model's save method.
    - `success` *(Function)*: Callback function to be called when fetch succeeds, passed `response` as argument.
    - `error` *(Function)*: Callback function to be called when fetch fails, passed `response` as argument.

#### Example
```js
define(['lazoSyncher'], function (LazoSyncher) {

    return LazoSyncher.extend({

        add: function(attributes, options){
            // Do some async get
            this.proxy.post('http://path/to/model', {
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

### `update(attributes, options)`

The update method will be called when the LazoModel's save method is executed.

#### Arguments
1. `arguments` *(Object)*: A hash of the model's state that will update the attributes of a model.
1. `options` *(Object)*: The options specified in a call to a model's save method.
    - `success` *(Function)*: Callback function to be called when fetch succeeds, passed `response` as argument.
    - `error` *(Function)*: Callback function to be called when fetch fails, passed `response` as argument.

#### Example
```js
define(['lazoSyncher'], function (LazoSyncher) {

    return LazoSyncher.extend({

        update: function(attributes, options){
            // Do some async get
            this.proxy.put('http://path/to/model', {
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

### `destroy(options)`

The destroy method will be called when the LazoModel's destroy method is executed.

#### Arguments
1. `options` *(Object)*: The options specified in a call to a model's destroy method.
    - `success` *(Function)*: Callback function to be called when fetch succeeds, passed `response` as argument.
    - `error` *(Function)*: Callback function to be called when fetch fails, passed `response` as argument.

#### Example
```js
define(['lazoSyncher'], function (LazoSyncher) {

    return LazoSyncher.extend({

        destroy: function(options){
            // Do some async get
            this.proxy.destroy('http://path/to/model', {}, {
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

### `proxy`

See [Service Proxy](ServiceProxy.md).
