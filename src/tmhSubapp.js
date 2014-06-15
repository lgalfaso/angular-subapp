(function(window) {
  'use strict';

  var BIND_PATTERN = /^(?:x[\:\-_]|data[\:\-_])?bind[\:\-_]([a-zA-Z][a-zA-Z0-9]*)$/,
      REFLECT_PATTERN = /^(?:x[\:\-_]|data[\:\-_])?reflect[\:\-_]([a-zA-Z][a-zA-Z0-9]*)$/,
      UPDATE_ON_PATTERN = /^(?:x[\:\-_]|data[\:\-_])?update[\:\-_]on$/,
      UPDATE_ON_EXP_PATTERN = /^(?:x[\:\-_]|data[\:\-_])?update[\:\-_]on[\:\-_]exp$/;

  angular.module('tmh.subapp', []).directive('tmhSubapp', ['$parse', '$interpolate', function ($parse, $interpolate) {
    var baseElement,
      subappRoot,
      modules,
      onInit;

    return {
      restrict: 'EA',
      compile: compileFn,
      priority: 10000,
      terminal: true
    };


    function compileFn(tElement, tAttrs) {
      baseElement = tElement;
      subappRoot = tElement.contents();
      tElement.empty();
      modules = tAttrs.modules;
      onInit = tAttrs.onInit;
      tElement.replaceWith(document.createComment(' subapp '));
      return linkFn;
    }

    function linkFn(scope, iElement) {
      var subappClone = subappRoot.clone(),
        injector = angular.bootstrap(subappClone, scope.$eval(modules)),
        $rootScope = injector.get('$rootScope');

      iElement.after(subappClone);
      addBindsAndTriggers(scope, $rootScope);

      $parse(onInit)(scope, {
          $rootScope: scope.$root,
          scope: scope,
          element: baseElement,
          $childRootScope: $rootScope,
          $childRootElement: injector.get('$rootElement'),
          $childInjector: injector
      });
    }

    function addBindsAndTriggers(parentScope, childScope) {
      var watchers = [],
        postQueue = [];
      angular.forEach(baseElement[0].attributes, function (attr) {
        var match;
         
        match = attr.name.match(BIND_PATTERN);
        if (match) { // A two way bind
          twoWayBind(parentScope, childScope, match[1], attr.value, watchers);
        }

        match = attr.name.match(REFLECT_PATTERN);
        if (match) { // Reflect property
          oneWayReflect(parentScope, childScope, match[1], attr.value);
        }

        match = attr.name.match(UPDATE_ON_PATTERN);
        if (match) {
          setupUpdateOn(parentScope, childScope, attr.value);
        }

        match = attr.name.match(UPDATE_ON_EXP_PATTERN);
        if (match) {
          postQueue.push(setupUpdateOnExpression(parentScope, childScope, attr.value));
        }
      });
      angular.forEach(postQueue, function (fn) { fn(); });
      if (watchers.length) {
        parentScope.$on('$destroy', function () {
          angular.forEach(watchers, function (watcher) { watcher(); });
        });
      }
    }

    function twoWayBind(parentScope, childScope, childPropertyName, parentExpression, watchers) {
      var lastValue, parentGet, parentSet, compare;

      parentGet = $parse(parentExpression);
      parentSet = parentGet.assign || function () {
        var lastGoodValue = parentGet(parentScope);
        lastValue = lastGoodValue;
        childScope.$evalAsync(function () { childScope[childPropertyName] = lastGoodValue; });
        throw new Error('Expression \'' + parentExpression + '\' is not assignable');
      };
      compare = parentGet.literal ? angular.equals : function (lhs, rhs) { return lhs === rhs; };
       parentScope.$watch(parentGet, function (newValue) {
        lastValue = newValue;
        childScope.$evalAsync(function () { childScope[childPropertyName] = newValue; });
      }, parentGet.literal);
      watchers.push(childScope.$watch(childPropertyName, function (newValue) {
        var parentValue = parentGet(parentScope);
        if (!compare(parentValue, childScope[childPropertyName])) {
          if (!compare(parentValue, lastValue)) {
            lastValue = parentValue;
            childScope.$evalAsync(function () { childScope[childPropertyName] = parentValue; });
          } else {
            lastValue = newValue;
            parentScope.$evalAsync(function () { parentSet(parentScope, newValue); });
          }
        }
      }));
    }

    function oneWayReflect(parentScope, childScope, childPropertyName, expression) {
      parentScope.$watch($interpolate(expression), function (newValue) {
        childScope.$evalAsync(function () { childScope[childPropertyName] = newValue; });
      });
    }

    function setupUpdateOn(parentScope, childScope, event) {
      parentScope.$on(event, function () { childScope.$digest(); });
    }

    function setupUpdateOnExpression(parentScope, childScope, expression) {
      return function () { parentScope.$watch(expression, function () { childScope.$digest(); }); };
    }

  }]);
}());

