(function(window) {
  'use strict';

  var BIND_PATTERN = /^bind-([a-zA-Z][a-zA-Z0-9]*)$/,
      REFLECT_PATTERN = /^reflect-([a-zA-Z][a-zA-Z0-9]*)$/;

  angular.module('tmh.subapp', []).directive('tmhSubapp', ['$parse', '$interpolate', function ($parse, $interpolate) {
    var baseElement,
      subappRoot,
      modules,
      observer;

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
      observer = tAttrs.observer;
      tElement.replaceWith(document.createComment(' subapp '));
      return linkFn;
    }

    function linkFn(scope, iElement) {
      var subappClone = subappRoot.clone(),
        injector = angular.bootstrap(subappClone, scope.$eval(modules)),
        $rootScope = injector.get('$rootScope');

      iElement.after(subappClone);
      bindParameters(scope, $rootScope);
      addDigestTriggers(scope, $rootScope);
      $parse(observer)(scope, {
          $rootScope: scope.$root,
          scope: scope,
          element: baseElement,
          $childRootScope: $rootScope,
          $childRootElement: injector.get('$rootElement'),
          $childInjector: injector
      });
    }

    function bindParameters(parentScope, childScope) {
      var watchers = [];
      angular.forEach(baseElement[0].attributes, function (attr) {
        var match, lastValue, parentGet, parentSet, childPropertyName, compare;
         
        match = attr.name.match(BIND_PATTERN);
        if (match) { // A two way bind
          childPropertyName = match[1];
          parentGet = $parse(attr.value);
          parentSet = parentGet.assign || function () {
            var lastGoodValue = parentGet(parentScope);
            lastValue = lastGoodValue;
            childScope.$evalAsync(function () { childScope[childPropertyName] = lastGoodValue; });
            throw new Error('Expression \'' + attr.value + '\' is not assignable');
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


        match = attr.name.match(REFLECT_PATTERN);
        if (match) { // Reflect property
          childPropertyName = match[1];
          parentScope.$watch($interpolate(attr.value), function (newValue) {
            childScope.$evalAsync(function () { childScope[childPropertyName] = newValue; });
          });
        }
      });
      if (watchers.length) {
        parentScope.$on('$destroy', function () {
          angular.forEach(watchers, function (watcher) { watcher(); });
        });
      }
    }

    function addDigestTriggers(parentScope, childScope) {
      var value;

      value = baseElement.attr('update-on');
      if (value) {
        parentScope.$on(value, function () { childScope.$digest(); });
      }
      value = baseElement.attr('update-on-exp');
      if (value) {
        parentScope.$watch(value, function () { childScope.$digest(); });
      }
    }
  }]);
}());

