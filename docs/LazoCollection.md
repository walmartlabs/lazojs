Lazo collections extend [Backbone.Collection](http://backbonejs.org/#Collection).
Lazo also has the concept of a proxy layer – one for the client and one for the server. On the client it leverages a custom
[Backbone.sync](http://backbonejs.org/#Sync) that sends all requests through a tunnel end
point on the Lazo application server. On the server it either forwards the request directly
to an service end point or if a [LazoSyncher](LazoSyncher.md)  exists for the collection Lazo forwards
the request to the LazoSyncher.

```javascript
define(['lazoCollection'], function (LazoCollection) {

    'use strict';

    return LazoCollection.extend({

        doSomething: function () {
            return 'something';
        }

    });

});
```


### `constructor(models, options)`

Creates a new `LazoCollection` instance.
You may override it if you need to perform some initialization while the instance is created.
The `LazoCollection` constructor must be called though.

Calls the [Backbone.Collection.constructor](http://backbonejs.org/#Collection-constructor).

#### Arguments
1. `models` *(Object)*: See [Backbone.Collection.constructor](http://backbonejs.org/#Collection-constructor).
1. `options` *(Object)*: See [Backbone.Collection.constructor](http://backbonejs.org/#Collection-constructor).
    - `name` *(String)*: Collection name.
    - `params` *(Object)*: A hash of name-value pairs used in url substitution.
    - `ctx` *(Object)*: The current context for the request. See *TODO: ADD LINK*.
    - `[modelName]` *(String)*: Specify the LazoModel class that the collection contains.  This should be the name of the model in the repo.  This *MUST* be used with the Backbone.Collection model property..

#### Example
```js
var models = [{ name: 'Foo' }, { name: 'Bar' }, { name: 'Baz' }];
var options = {
    name: 'LazoCollection',
    params: {},
    ctx: {}
};

new LazoCollection(models, options);
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
var method = 'validate';
var arguments = lazoColleciton.toJSON();
var options = {
    success: function(){},
    error: function: function(){}
};
lazoCollection.call(method, arguments, options);
```
