(function () {
  'use strict';

  function countWatches(scope) {
    var childScope,
      result = 0;

    if (scope) {
      result += scope.$$watchers ? scope.$$watchers.length : 0;
      for (childScope = scope.$$childHead; childScope; childScope = childScope.$$nextSibling) {
        result += countWatches(childScope);
      }
    }
    return result;
  }

  describe('subapp', function() {
    beforeEach(module('tmh.subapp'));

    it('should be possible to define a subapp', inject(function ($rootScope, $compile) {
      var baseElement = angular.element('<div><tmh-subapp><div ng-init="name = \'World\'">Hello {{name}}</div></tmh-subapp></div>'),
        transcludeFn,
        element;

      transcludeFn = $compile(baseElement);
      expect(baseElement.html()).toBe('<!-- subapp -->');

      element = transcludeFn($rootScope);
      expect(element.text()).toBe('Hello World'); 
    }));

    it('should have a different injector', inject(function ($injector, $rootScope, $compile) {
      var element = $compile('<div><tmh-subapp><div ng-init="name = \'World\'">Hello {{name}}</div></tmh-subapp></div>')($rootScope);

      expect(element.find('div').injector()).not.toBeUndefined();
      expect($injector).not.toBe(element.find('div').injector());
    }));

    it('should remove the data from the child $rootElement when destroying the sub app', inject(function ($rootScope, $compile) {
      var element = $compile('<div><div ng-if="foo"><tmh-subapp><span ng-init="name = \'World\'">Hello {{name}}</span></tmh-subapp></div></div>')($rootScope),
        childInjector;

      $rootScope.foo = true;
      $rootScope.$digest();
      childInjector = element.find('span').injector();
      expect(childInjector.get('$rootElement').data('$injector')).not.toBeUndefined();

      $rootScope.foo = false;
      $rootScope.$digest();
      expect(childInjector.get('$rootElement').data('$injector')).toBeUndefined();
    }));

    describe('transclude and subapps', function () {      
      it('should be have different injectors', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><div ng-repeat="item in [0, 1]"><tmh-subapp>' +
              '<span ng-init="name = \'World\'">Hello {{name}}</span>' +
            '</tmh-subapp></div></div>')($rootScope),
          childInjector1,
          childInjector2;

        $rootScope.$digest();
        childInjector1 = angular.element(element.find('span')[0]).injector();
        childInjector2 = angular.element(element.find('span')[1]).injector();

        expect(childInjector1).not.toBeUndefined();
        expect(childInjector2).not.toBeUndefined();
        expect(childInjector1).not.toBe(childInjector2);
      }));

      it('should use different elements in each transclusion', inject(function ($rootScope, $compile) {
        var element = $compile('<div><div ng-repeat="item in items"><tmh-subapp><span>Hello World</span></tmh-subapp></div></div>')($rootScope);

        $rootScope.items = [0];
        $rootScope.$digest();

        element.find('span').empty();
        $rootScope.items = [0, 1];
        $rootScope.$digest();
        expect(angular.element(element.find('span')[0]).text()).toBe('');
        expect(angular.element(element.find('span')[1]).text()).toBe('Hello World');
      }));
    });

    describe('defining modules', function () {
      beforeEach(function () {
        angular.module('test', []).directive('testDirective', function () {
          return {
            template: '<div>Hello World</div>'
          };
        });
      });

      it('should be possible to define what modules to load', inject(function ($rootScope, $compile) {
        var element = $compile('<div><tmh-subapp modules="[\'test\']"><div test-directive></div></tmh-subapp></div>')($rootScope);
        expect(element.text()).toBe('Hello World');
      }));

      it('should evaluate the modules at link time', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><div ng-repeat="item in items"><tmh-subapp modules="modules">' +
              '<div test-directive></div>' +
            '</tmh-subapp></div></div>')($rootScope);
        $rootScope.items = [0];
        $rootScope.modules = [];
        $rootScope.$digest();

        expect(element.text()).toBe('');

        $rootScope.items = [0, 1];
        $rootScope.modules = ['test'];
        $rootScope.$digest();

        expect(element.text()).toBe('Hello World');
      }));
    });

    describe('observer', function () {
      it('should be possible to define an observer', inject(function ($rootScope, $compile) {
        var element, observerRootScope, subAppScope, subAppElement, $childRootScope, $childRootElement, $childInjector;

        element = $compile(
          '<div><div ng-if="true"><tmh-subapp test="value" observer="foo($rootScope, scope, element, $childRootScope, $childRootElement, $childInjector)">' +
            '<span></span>' +
          '</tmh-subapp></div></div>')($rootScope);
        $rootScope.foo = function (rootScope, baseScope, baseElement, childRootScope, childRootElement, childInjector) {
          observerRootScope = rootScope;
          subAppScope = baseScope;
          subAppElement = baseElement;
          $childRootScope = childRootScope;
          $childRootElement = childRootElement;
          $childInjector = childInjector;
        };
        $rootScope.$digest();

        expect(observerRootScope).toBe($rootScope);
        expect(subAppScope).toBe(element.find('div').scope());
        expect(subAppElement.attr('test')).toBe('value');
        expect($childRootScope).toBe(element.find('span').injector().get('$rootScope'));
        expect(element.find('span')[0]).toBe($childRootElement[0]);
        expect($childInjector).toBe(element.find('span').injector());
      }));
    });

    describe('binding parameters', function () {
      it('should be able to bind a parameter from the parent scope to the sub-app root scope', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp bind-foo="bar">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');

        $rootScope.bar = 'Hello World';
        $rootScope.$digest();
        expect(element.text()).toBe('');
        childRootScope.$digest();
        expect(element.text()).toBe('Hello World');
      }));

      it('should be able to reflect changes on the parent scope to the child scope', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp bind-foo="bar">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');

        $rootScope.bar = '';
        $rootScope.$digest();
        childRootScope.$digest();
        $rootScope.bar = 'Hello World';
        $rootScope.$digest();
        expect(element.text()).toBe('');
        expect(childRootScope.foo).toBe('');
        childRootScope.$digest();
        expect(childRootScope.foo).toBe('Hello World');
        expect(element.text()).toBe('Hello World');
      }));

      it('should be able to reflect changes on the child scope back to the parent scope', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp bind-foo="bar">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');
      
        $rootScope.bar = '';
        $rootScope.$digest();
        childRootScope.$digest();
        childRootScope.foo = 'Hello World';
        childRootScope.$digest();
        expect($rootScope.bar).toBe('');
        $rootScope.$digest();
        expect($rootScope.bar).toBe('Hello World');
      }));

      it('should resolve conflicts by taking the parent value when starting from the child', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp bind-foo="bar">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');

        $rootScope.bar = '';
        $rootScope.$digest();
        childRootScope.$digest();
        $rootScope.bar = 'Hello World';
        childRootScope.foo = 'Goodbye World';
        childRootScope.$digest();
        expect(childRootScope.foo).toBe('Hello World');
        $rootScope.$digest();
        expect($rootScope.bar).toBe('Hello World');
      }));

      it('should resolve conflicts by taking the parent value when starting from the parent', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp bind-foo="bar">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');
      
        $rootScope.bar = '';
        $rootScope.$digest();
        childRootScope.$digest();
        $rootScope.bar = 'Hello World';
        childRootScope.foo = 'Goodbye World';
        $rootScope.$digest();
        expect(childRootScope.foo).toBe('Goodbye World');
        childRootScope.$digest();
        expect(childRootScope.foo).toBe('Hello World');
      }));

      describe('literals', function () {
        it('should copy parent changes', inject(function ($rootScope, $compile) {
          var element = $compile(
              '<div><tmh-subapp bind-foo="{name: name}">' +
                '<span>{{foo}}</span>' +
              '</tmh-subapp></div>')($rootScope),
            childRootScope = element.find('span').injector().get('$rootScope');

          $rootScope.name = 'a';
          $rootScope.$apply();
          childRootScope.$digest();
          expect(childRootScope.foo).toEqual({name: 'a'});

          $rootScope.name = 'b';
          $rootScope.$apply();
          childRootScope.$digest();
          expect(childRootScope.foo).toEqual({name: 'b'});
        }));

        it('should not change the component when parent does not change', inject(function ($rootScope, $compile) {
          var element = $compile(
              '<div><tmh-subapp bind-foo="{name: name}">' +
                '<span>{{foo}}</span>' +
              '</tmh-subapp></div>')($rootScope),
            childRootScope = element.find('span').injector().get('$rootScope');

          $rootScope.name = 'a';
          $rootScope.$apply();
          childRootScope.$digest();
          var lastComponentValue = childRootScope.foo;
          $rootScope.$apply();
          childRootScope.$digest();
          expect(childRootScope.foo).toBe(lastComponentValue);
        }));

        it('should complain when the component changes', inject(function ($rootScope, $compile) {
          var element = $compile(
              '<div><tmh-subapp bind-foo="{name: name}">' +
                '<span>{{foo}}</span>' +
              '</tmh-subapp></div>')($rootScope),
            childRootScope = element.find('span').injector().get('$rootScope');

          $rootScope.name = 'a';
          $rootScope.$apply();
          childRootScope.$digest();
          childRootScope.foo = {name: 'b'};
          expect(function() {
            childRootScope.$digest();
            $rootScope.$apply();
          }).toThrow(new Error("Expression '{name: name}' is not assignable"));
        }));
      });

      it('should remove the watchers on the sub-app root scope', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><div ng-if="exp"><tmh-subapp bind-foo="bar">' +
              '<span>Hello World</span>' +
            '</tmh-subapp></div></div>')($rootScope),
          childRootScope;

        $rootScope.exp = true;
        $rootScope.bar = "bar";
        $rootScope.$digest();
        childRootScope = element.find('span').injector().get('$rootScope');

        expect(countWatches($rootScope)).toBe(2); // one for the bind and one for the ng-if
        expect(countWatches(childRootScope)).toBe(1);

        $rootScope.exp = false;
        $rootScope.$digest();

        expect(countWatches(childRootScope)).toBe(0);
      }));
    });

    describe('reflect properties', function () {
      it('should be able to reflect properties to the child scope', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp reflect-foo="Hello {{bar}}">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');

        $rootScope.bar = '';
        $rootScope.$digest();
        childRootScope.$digest();
        $rootScope.bar = 'World';
        $rootScope.$digest();
        expect(element.text()).toBe('Hello ');
        expect(childRootScope.foo).toBe('Hello ');
        childRootScope.$digest();
        expect(childRootScope.foo).toBe('Hello World');
        expect(element.text()).toBe('Hello World');
      }));

      it('should be able to reflect properties changes to the child scope', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp reflect-foo="Hello {{bar}}">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');

        $rootScope.bar = '';
        $rootScope.$digest();
        childRootScope.$digest();
        $rootScope.bar = 'World';
        $rootScope.$digest();
        childRootScope.$digest();
        expect(childRootScope.foo).toBe('Hello World');
        expect(element.text()).toBe('Hello World');
        $rootScope.bar = 'Universe';
        $rootScope.$digest();
        childRootScope.$digest();
        expect(childRootScope.foo).toBe('Hello Universe');
        expect(element.text()).toBe('Hello Universe');
      }));
    });

    describe('update on event', function () {
      it('should be possible to trigger a digest to the child app on an event on the parent app', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp update-on="updateSubapp" reflect-foo="Hello {{bar}}">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');

        $rootScope.bar = 'World';
        $rootScope.$digest();
        childRootScope.$digest();
        $rootScope.bar = 'Universe';
        $rootScope.$digest();
        $rootScope.$broadcast('updateSubapp');
        expect(childRootScope.foo).toBe('Hello Universe');
        expect(element.text()).toBe('Hello Universe');
      }));
    });

    describe('update on expression change', function () {
      it('should be possible to trigger a digest to the child app on a property change', inject(function ($rootScope, $compile) {
        var element = $compile(
            '<div><tmh-subapp update-on-exp="bar" reflect-foo="Hello {{bar}}">' +
              '<span>{{foo}}</span>' +
            '</tmh-subapp></div>')($rootScope),
          childRootScope = element.find('span').injector().get('$rootScope');

        $rootScope.bar = 'World';
        $rootScope.$digest();
        childRootScope.$digest();
        $rootScope.bar = 'Universe';
        $rootScope.$digest();
        expect(childRootScope.foo).toBe('Hello Universe');
        expect(element.text()).toBe('Hello Universe');
      }));
    });
  });

}());
