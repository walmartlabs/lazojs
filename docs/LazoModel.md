LazoModels extend [Backbone.Model](http://backbonejs.org/#Model). Lazo also has the concept of a proxy
layer – one for the client and one for the server. On the client it leverages a custom
[Backbone.sync](http://backbonejs.org/#Sync) that sends all requests through a tunnel end
point on the Lazo application server. On the server it either forwards the request directly
to an service end point or if a [LazoSyncher](LazoSyncher.md) exists for the model Lazo forwards
the request to the LazoSyncher.


```js
define(['lazoModel'], function (LazoModel) {

    return LazoModel.extend({

        doSomething: function () {
            return 'something';
        }

    });

});
```

### `constructor(attributes, options)`

Creates a new `LazoModel` instance.
You may override it if you need to perform some initialization while the instance is created.
The `LazoModel` constructor must be called though.

Calls the [Backbone.Model.constructor](http://backbonejs.org/#Model-constructor).

#### Arguments
1. `attributes` *(Object)*: See [Backbone.Model.constructor](http://backbonejs.org/#Model-constructor).
1. `options` *(Object)*: See [Backbone.Model.constructor](http://backbonejs.org/#Model-constructor).
    - `name` *(String)*: Model name.
    - `params` *(Object)*: A hash of name-value pairs used in url substitution.
    - `ctx` *(Object)*: The current context for the request. See *TODO: ADD LINK*.

#### Example
```js
var attributes = { data: 'abc' };
var options = {
    name: 'LazoModel',
    params: {
        id: 123
    },
    ctx: {}
};

new LazoModel(attributes, options);
```


### `call(name, arguments, options)`

Calls the `name` method on the syncher, passing in `arguments` and `options`.

*Note - The syncher is a server only concept, so this will initiate a tunnel call.*

#### Arguments
1. `name` *(String)*: Name of function to call on the syncher.
1. `arguments` *(&#42;)*: Passed to the function as the first param.
1. `options` *(Object)*: Passed to the function as the second param.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var method = 'checkName';
var arguments = 'Name';
var options = {
    success: function(){},
    error: function: function(){}
};

lazoModel.call(method, arguments, options);
```


### `save([attributes], [options])`

Override of [Backbone.Model.save](http://backbonejs.org/#Model-save).
Exact same functionality except when `options.persist` is false, it will no-op.

#### Arguments
1. `[attributes]` *(Object)*: Attributes to change prior to save.
1. `options` *(Object)*: Options for save. See [Backbone.Model.save](http://backbonejs.org/#Model-save).
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var attributes = { name: 'Name' };
var options = {
    success: function(){},
    error: function: function(){}
};

lazoModel.save(attributes, options);
```
