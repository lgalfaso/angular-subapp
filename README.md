# Angular Sub App

***

## Adds the ability to run an angular app inside another angular app

This directive adds the ability to run one angular app inside another. The main
reason one would like to do this is performance.

The use of this library is not an approach for everybody, nor one that should
be used lightly.


## Installation

Add the module to your dependencies

```javascript
angular.module('myApp', ['tmh.subapp', ...])
```


## Usage

### Requirements

* **AngularJS v1.2.17+** is currently required.

### Directives

This library specifies one directive `tmh-subapp`. Place your sub-app
inside a `<tmh-subapp>` and it will be executed as an independent angular
application.

E.g

```html
<div ng-app="myApp">
  <tmh-subapp>
    <div ng-init="name = 'World'">Hello {{name}} from a sub-app</div>
  </tmh-subapp>
</div>
```

#### Limitations

The `<tmh-subapp>` tag must have only one direct child node that must be an element.
This limitation is needed as an angular app must only have one `$rootElement`.


#### The `modules` parameter

It is possible to define the modules the sub-app should with the `modules` attrubute.
The `modules` attribute must be an expression that evaluates to an array of the modules
for the sub-app.

```html
<div ng-app="myApp">
  <tmh-subapp modules="['module.a', 'module.b']">
    <div>
      <module-a-directive>Hello World</module-a-directive>
      <module-b-directive>from a sub-app</module-b-directive>
    </div>
  </tmh-subapp>
</div>
```


#### Binding parameters

It is possible to do two-way bind of parameters between the parent app and the sub-app.
Attributes that start with `bind-` generate two-way bindings between the parent app scope
and the sub-app root scope. The property used on the child sub-app will be the name of the
attribute after removing `bind-` and the expression on the parent scope will be the attribute
value.

```html
<div ng-app="myApp">
  <tmh-subapp bind-foo="bar">
    <span>{{foo}}</span>
  </tmh-subapp>
</div>
```

##### Limitation

The name of the property on the sub-app must follow the pattern `/[a-zA-Z][a-zA-Z0-9]*/`


#### Reflecting expressions

It is possible to reflect expressions from the parent app to the sub-app. All attributes
that start with `reflect-` will generate a one-way mechanism to reflect an expression to the
child root scope. The property used on the child sub-app will be the name of the attribute
after removing `reflect-` and the expression reflected will be the interpolation on the parent
scope of the attribute value.

```html
<div ng-app="myApp">
  <tmh-subapp reflect-greeting="Hello {{name}}">
    <span>{{greeting}}</span>
  </tmh-subapp>
</div>
```

##### Limitation

The name of the property on the sub-app must follow the pattern `/[a-zA-Z][a-zA-Z0-9]*/`


#### Triggering a `$digest` on the child sub-app based on actions from the parent app

There are two ways to define that a `$digest` is needed on the child sub-app based on actions
on the parent app.

* Specify the attribute `update-on` to define an event that when generated on the parent app, will perform a `$digest`
on the child sub-app. The value of the attribute will be the event that will trigger a child sub-app `$digest`. The
scope that will be used to listen for the event is the same scope that the element `tmh-subapp` is at.

*Specify the attribute `update-on-exp` to define an expression that when the expression changes, will
trigger a `$digest` on the child sub-app. The expression will be evaluated at the scope that the element `tmh-subapp`
is at.

```html
<div ng-app="myApp">
  <tmh-subapp update-on="subAppDigest" reflect-greeting="Hello {{name}}">
    <!-- When the parent app generates an event named 'subAppDigest' it will trigger a `$digest` on the child sub-app -->
    <span>{{greeting}}</span>
  </tmh-subapp>
</div>
```

```html
<div ng-app="myApp">
  <tmh-subapp update-on-exp="counter" reflect-greeting="Hello {{name}}">
    <!-- When the expression `counter` changes, it will trigger a `$digest` on the child sub-app -->
    <span>{{greeting}}</span>
  </tmh-subapp>
</div>
```


#### on-init

It is possible to define a function that will be called once the sub-app is initialized. To define the function that
will be called, specify the attribute `on-init`. The value of the attribute must be a function call that can accept
any of the following values:

* $rootScope: The parent root scope
* scope: The scope on the parent app were the element is defined
* element: The tmh-subapp element
* $childRootScope: The child sub-app root scope
* $childRootElement: The child sub-app root element
* $childInjector: The child-sub-app `$injector`


```html
<div ng-app="myApp">
  <div ng-if="someExpression">
    <tmh-subapp on-init="foo($rootScope, scope, element, $childRootScope, $childRootElement, $childInjector)">
      <span>...</span>
    </tmh-subapp>
  </div>
</div>
```

## Development

### Requirements

0. Install [Node.js](http://nodejs.org/) and NPM (should come with)

1. Install global dependencies `grunt-cli` and `bower`:

    ```bash
    $ npm install -g grunt-cli bower
    ```

2. Install local dependencies:

    ```bash
    $ npm install
    ```

### Running the tests

```bash
$ grunt karma:unit
```
to run the test once

or

```bash
$ grunt karma:autotest
```
to run the tests continuously

