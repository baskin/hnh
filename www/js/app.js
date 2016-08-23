var module = ons.bootstrap('app', ['onsen', 'ngStorage', 'ngMaterial', 'ngMessages', 'material.svgAssetsCache', 'ngFitText']);

// filters
module.filter('unescape', function() {
    return window.decodeURIComponent;
});

module.filter('trustUrl', function ($sce) {
      return function(url) {
          return $sce.trustAsResourceUrl(url);
      };
});

// directives
module.directive('hideOnError', function($timeout) {
    return {
       transclude: true,
       template: '<div ng-show="showEl"><div ng-transclude></div></div>',
       link: function(scope, element, attrs) {
           element.bind('error', function() {
               console.log("error fetching element. will hide.");
               $timeout(function() {
                   scope.showEl = false;
               }, 1000);
           })
       }
}});

console.log("App module created");