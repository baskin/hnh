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

module.filter('hashValues', function() {
    return function($hash) {
        var keys = Object.keys($hash);
        return keys.map(function(v) { return $hash[v]; });
    }
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

module.service('bookmarksService', function($localStorage) {

    $localStorage.$default({
        bookmarks: {}
    });
    this.add = function(hunt) {
        console.log("Adding to bookmarks");
        $localStorage.bookmarks[hunt.id] = hunt;
    }

    this.remove = function(hunt) {
        delete $localStorage.bookmarks[hunt.id];
    }

    this.has = function(hunt) {
      return hunt.id in $localStorage.bookmarks;
    }

    this.getAll = function() {
        var keys = Object.keys($localStorage.bookmarks);
        return keys.map(function(v) { return $localStorage.bookmarks[v]; });
    }

});

console.log("App module created");