### `LazoModel.call(name, arguments, options)`

Calls the `name` method on the syncher, passing in `arguments` and `options`.

#### Arguments
1. `name` *(String)*: Name of function to call on the syncher.
1. `arguments` *(&#42;)*: Passed to the function as the first param.
1. `options` *(Object)*: Passed to the function as the second param.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
model.call('checkName', 'Name', {
    success: function(){},
    error: function: function(){}
});
```
