## LazoModel

Lazo models and collections extend [Backbone.Model](http://backbonejs.org/#Model) and
[Backbone.Collection](http://backbonejs.org/#Collection). Lazo also has the concept of a proxy
layer – one for the client and one for the server. On the client it leverages a custom
[Backbone.sync](http://backbonejs.org/#Sync) that sends all requests through a tunnel end
point on the Lazo application server. On the server it either forwards the request directly
to an service end point or if a Lazo syncher exists for the model, collection Lazo forwards
the request to the Lazo syncher.


```js
define(['lazoModel'], function (LazoModel) {

    var host = 'http://someservicehost.com/'

    return LazoModel.extend({

        url: function () {
            var params = this.params;
            return host + params.department + '/' + params.page + '/';
        }

    });

});
```


### `call(name, arguments, options)`

Calls the `name` method on the syncher, passing in `arguments` and `options`.

#### Arguments
1. `name` *(String)*: Name of function to call on the syncher.
1. `arguments` *(&#42;)*: Passed to the function as the first param.
1. `options` *(Object)*: Passed to the function as the second param.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
lazoModel.call('checkName', 'Name', {
    success: function(){},
    error: function: function(){}
});
```
