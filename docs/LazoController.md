In LazoJS, controllers are optional, but the `LazoController` class must be [**extended**](#extend) for implementing the business logic of a new component.

A controller is where routing action handlers must be implemented and it is also the recommended place to keep view action handlers. Having *fat controllers* and *thin views* is a practice that should facilitate testing, since views are typically more difficult to test.

```javascript
define(['lazoCtl'], function (LazoController) {

  'use strict';

  // Call the extend static method
  return LazoController.extend({
    // Example of routing action handler
    index: function (options) {
      var self = this;

      // Load a model
      self.loadModel('myModel', {
        error: options.error,

        success: function (myModel) {
          // Add model instance to the component's context object
          self.ctx.models.myModel = myModel;

          // Call the router callback, passing the name if the view to be rendered
          options.success('index');
        }
      });
    },

    // Example of view action handler
    save: function (data, options) {
      // Save the data provided by the view into the model instance and all the way to the server
      this.ctx.models.myModel.save(data, options);
    }
  });
});
```

### `addChild(container, cmpName, options)`

Adds a child component into the given container.

#### Arguments

1. `container` *(String)*: A component container name, it has to match the `lazo-cmp-container` attribute value from an existing tag in the current view;
1. `cmpName` *(String)*: The name of component to be instantiated and added inside the given container;
1. `[options]` *(Object)*: The `options` hash:
  - `[ctx]` *(Object)*: The context object to be passed to the child component;
  - `[error]` *(Function)*: Called if an error occurs, it must implement the `function(error)` interface:
      - `error` *(Error)*: The `Error` instance;
  - `[success]` *(Function)*: Called after the child component has been successfully instantiated and added to the current view, it must implement the `function(childController)` interface:
    - `childController` *(Object)*: The child controller instance.

#### Example

First, include a component container into current's view markup:

```html
<div lazo-cmp-container="foo"><!-- CHILDREN GO HERE --></div>
```

Then, add a child component from the parent controller:

```javascript
this.addChild('foo', 'bar', {
  ctx: {
    params: this.ctx.params
  },
  error: function (error){
    console.log('Oops...');
  },
  success: function (barController){
    console.log('Yay!'); // bar has been added to foo!
  }
});
```

<!--
### `augmentCssLink(link)`

#### Arguments

#### Returns

#### Example
-->

<!--
### `augmentImportLink(link)`

#### Arguments

#### Returns

#### Example
-->

### `clearCookie(name, [options])`

Clears a cookie. See [`setCookie`](#setCookie).

#### Arguments

1. `name` *(String)*: The cookie name;
1.  `[options]` *(Object)*: The options hash:
  - `[domain]` *(String)*: The domain where the cookie is valid. It defaults to the current domain;
  - `[path]` *(String)*: The path where the cookie is valid. It defaults to the current path.

#### Example

```javascript
this.clearCookie('preferences', {
  domain: 'example.com',
  path: '/'
});

```

### `constructor(options)`

Creates a new controller instance. You may override it if you need to perform some initialization while the instance is created. The `LazoController` (or current superclass) constructor must be called though.

Consider overriding [`initialize`](#initialize) instead.

```javascript
var BaseController = LazoController.extend({
  constructor: function (options){
    this.createdOn = Date.now();
    return LazoController.apply(this, arguments);
  },
  createdOn: null
});
```

#### Arguments

1. `options` *(Object)*: The options hash:
  - `name` *(String)*: The component name.

#### Returns

*(Object)*: A new controller instance.

<!--
### `create(cmpName, ctlOptions, options)`

#### Arguments

#### Returns

#### Example
-->

### `createCollection(collectionName, attributes, options)`

Creates a new collection instance.

#### Arguments

1. `collectionName` *(String)*: The collection name, it should match a collection declared under the `models` directory;
1. `[attributes]` *(Array)*: An array of attributes to initialize the child models;
1. `options` *(Object)*: The options hash:
  - `[error]` *(Function)*: Called if an error occurs, it must implement the `function(error)` interface:
    - `error` *(Error)*: The `Error` instance;
  - `modelName` *(String)*: The model that should be used to create the child instances, it must match a existing model in the application repo;
  - `[params]` *(Object)*: The params hash, used in URL substitution;
  - `[success]` *(Function)*: Called after the collection instance has been successfully created, it must implement the `function(collection)` interface:
    - `collection` *(LazoCollection)*: The recently created collection instance.

#### Example

```javascript
this.createCollection('people', [
  {name: 'Tim', age: 5},
  {name: 'Ida', age: 26},
  {name: 'Rob', age: 55}
], {
  error: function (error) {
    console.log('Oops...');
  },
  modelName: 'person',
  success: function (collection) {
    console.log('Yay!');
    collection.length;  // 3
  }
});
```

### `createModel(modelName, attributes, options)`

Creates a new model instance.

#### Arguments

1. `modelName` *(String)*: The model name, it should match a model declared under the `models` directory;
1. `[attributes]` *(Object)*: An hash of attributes to initialize the model;
1. `options` *(Object)*: The options hash:
  - `[error]` *(Function)*: Called if an error occurs, it must implement the `function(error)` interface:
    - `error` *(Error)*: The `Error` instance;
  - `[params]` *(Object)*: The params hash, used in URL substitution;
  - `[success]` *(Function)*: Called after the model instance has been successfully created, it must implement the `function(model)` interface:
    - `model` *(LazoModel)*: The recently created model instance.

#### Example

```javascript
this.createModel('person', {
  name: 'Tim', age: 5
}, {
  error: function (error) {
    console.log('Oops...');
  },
  success: function (model) {
    console.log('Yay!');
    model.get('name');  // 'Tim'
  }
});
```

<!--
### `deserialize(ctl, options)`

#### Arguments

#### Returns

#### Example
-->

### <a name="extend"></a>`extend([properties], [classProperties])`

Creates a custom controller class.

#### Arguments

1. `[properties]` *(Object)*: An object describing the methods and properties for every class instance.
1. `[classProperties]` *(Object)*: An object describing the **static** methods and  properties to be added to the custom controller constructor.

#### Returns

*(Function)*: Returns a constructor function for the custom controller class.

#### Example

```javascript
var FooController = LazoController.extend({
  bar: 123,
  foo: function () {
    return 'foo';
  }
}, {
  baz: function () {
    return 'baz';
  },
  quux: 456
});

FooController.baz();  // 'baz'
FooController.quux;   // 456

var fooController = new FooController();

fooController instanceof FooController;   // true
fooController instanceof LazoController;  // true

fooController.bar;    // 123
fooController.foo();  // 'foo'
```

<!--
### `getImport(relativePath)`

#### Arguments

#### Returns

#### Example
-->

### `getPageTitle()`

Returns the current page title. See [`setPageTitle`](#setPageTitle).

#### Returns

*(String)*: The current page title.

<!--
### `getPath`

#### Arguments

#### Returns

#### Example
-->

### <a name="getSharedData"></a>`getSharedData(key)`

Returns the shared data stored under the given `key`. See  [`setSharedData`](#setSharedData).

#### Arguments

- `key` *(String)*: The string key to retrieve the stored data from.

#### Returns

*(Object)*: The shared data stored under the given `key`.

### <a name="initialize"></a>`initialize(options)`

Initialize the new controller instance. You may override it if you need to perform some initialization just after the instance is created.

```javascript
var BaseController = LazoController.extend({
  initialize: function (options){
    this.initOn = Date.now();
  },
  initOn: null
});
```

#### Arguments

- `options` *(Object)*: The options hash:
  - `name` *(String)*: The component name.

### `index(options)`

The default action handler. If not overridden, it renders the **index** view.

Any additional action handlers should implement the same interface. Action handlers should never be called directly. See [`navigate`](#navigate).

#### Arguments

- `[options]` *(Object)*: The options hash;
  - `[error]` *(Function)*: To be called if an error occurs, it implements the `function(error)` interface:
    - `error` *(Error)*: The `Error` instance;
  - `[success]` *(Function)*: To be called once the action handler is done and ready to return control to the framework, it implements the `function(viewName)` interface:
    - `viewName` *(String)*: The name of the view to be rendered.

#### Example

```javascript
return LazoController.extend({
  index: function (options) {
    var self = this;
    self.loadCollection('myCollection', {
      error: options.error,
      success: function (myCollection) {
        self.loadModel('myModel', {
          error: options.error,
          success: function (myModel) {
            self.ctx.collections.myCollection = myCollection;
            self.ctx.models.myModel = myModel;
            options.success('index');
          }
        });
      }
    });
  }
});
```

### `loadCollection(collectionName, options)`

Loads the given collection.

#### Arguments

1. `collectionName` *(String)*: The collection name, it should match a collection declared under the `models` directory;
1. `[options]` *(Object)*: The options hash:
  - `[error]` *(Function)*: Called if an error occurs, it must implement the `function(error)` interface:
    - `error` *(Error)*: The `Error` instance;
  - `[params]` *(Object)*: The params hash, used in URL substitution;
  - `[success]` *(Function)*: Called after the collection instance has been successfully loaded, it must implement the `function(collection)` interface;
    - `collection` *(LazoCollection)*: The collection instance.

#### Example

```javascript
this.loadCollection('people', {
  error: function (error) {
    console.log('Oops...');
  },
  params: {
    sortBy: 'name' // See LazoCollection for params usage
  },
  success: function (people) {
    console.log('Yay!');
  }
});
```

### `loadModel(modelName, options)`

Loads the given model.

#### Arguments

1. `modelName` *(String)*: The model name, it should match a model declared under the `models` directory;
1. `[options]` *(Object)*: The options hash:
  - `[error]` *(Function)*: Called if an error occurs, it must implement the `function(error)` interface:
    - `error` *(Error)*: The `Error` instance;
  - `[params]` *(Object)*: The params hash, used in URL substitution;
  - `[success]` *(Function)*: Called after the model instance has been successfully loaded, it must implement the `function(model)` interface:
    - `model` *(LazoModel)*: The model instance.

#### Example

```javascript
this.loadModel('person', {
  error: function (error) {
    console.log('Oops...');
  },
  params: {
    id: 123 // See LazoModel for params usage
  },
  success: function (people) {
    console.log('Yay!');
  }
});
```

### <a name="navigate"></a>`navigate(action, options)`

Forces navigation the to the given `action` handler.

#### Arguments

1. `action` *(String)*: The name of the action handler to be executed;
1. `[options]` *(Object)*: The options hash:
  - `[error]` *(Function)*: Called if an error occurs, it must implement the `function(error)` interface:
    - `error` *(Error)*: The `Error` instance;
  - `[success]` *(Function)*: Called if navigation is successful.

#### Example

```javascript
this.navigate('edit', {
  error: function (error) {
    console.log('Oops...');
  },
  success: function () {
    console.log('Yay!');
  }
});

```

<!--
### `serialize`

#### Arguments

#### Returns

#### Example
-->

### <a name="setCookie"></a>`setCookie(name, value, [options])`

Stores `value` under the given cookie `name`.

#### Arguments

1. `name` *(String)*: The cookie name;
2. `value` *(String)*: A string to be store under the cookie;
3.  `[options]` *(Object)*: The options hash:
  - `[domain]` *(String)*: The domain where the cookie is valid. It defaults to the current domain;
  - `[expires]` *(Number)*: The cookie lifetime in days since its creation. It defaults to zero (current session);
  - `[path]` *(String)*: The path where the cookie is valid. It defaults to the current path.

#### Example

```javascript
this.setCookie('preferences', 'foo=bar;baz=quux', {
  domain: 'example.com',
  expires: 365,
  path: '/'
});
```

### <a name="setPageTitle"></a>`setPageTitle(title)`

Sets the page title (displayed in the browser's title bar).

#### Arguments

- `title` *(String)*: The new page title.

### <a name="setSharedData"></a>`setSharedData(key, val)`

Stores random data that can be accessed from both server and client runtimes.

#### Arguments

- `key` *(String)*: The string key;
- `val` *(Object)*: The object to be stored and shared.

#### Returns

*(Object)*: The current controller instance.

#### Example

```javascript
this.setSharedData('foo', {
  bar: 'quux'
});
```

<!--
### `toJSON(rootCtx)`

#### Arguments

#### Returns

#### Example
-->

<!--
### `transition(prevCtx, view, options)`

#### Arguments

#### Returns

#### Example
-->
