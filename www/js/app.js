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

module.service('historyService', function($localStorage) {

    var HISTORY_SIZE = 25;

    $localStorage.$default({
        history: []
    });

    this.add = function(hunt) {
        $localStorage.history.unshift(hunt);
        if ($localStorage.history.length > HISTORY_SIZE) {
            // history size full, pop
            $localStorage.history.pop();
        }
    }

    this.getAll = function() {
        return $localStorage.history;
    }

});

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


module.service('randomHuntService', function($http, $localStorage) {

    var HUNTQ_IDLE_SIZE = 100;
    $localStorage.$default({
        huntq: []
    });

    this.sync = function($done) {

      if ($localStorage.huntq.length >= HUNTQ_IDLE_SIZE) {
          if ($done != null) {
              $done();
          }
          return;
      }
      console.log("Updating HuntQ...")
      var url = "https://api.producthunt.com/v1/posts";
      topicFilter = false;
      // 208 angel investing
      if (topicFilter) {
          url = url + "/all?search[topic]=" + 208; // TODO paging.
      }
      else {
          var daysAgo = Math.floor(Math.random() * 251);
          url = url + "?days_ago=" + daysAgo;
      }
      var headerOptions = {
          headers: {
              "Authorization": "Bearer fbf62059f1556488e5354cd3892095e35ac776e93769efc2a446df35db8b7e6c"
          }
      };

      $http.get(url, headerOptions).then(
        function(response) {
          console.log("Received success from url " + url);
            // First function handles success
            body = response.data['posts'];
            console.log("Fetched " + body.length + " hunts");
            $localStorage.huntq = $localStorage.huntq.concat(body);
            console.log("New HuntQ size " + $localStorage.huntq.length);
            if ($done != null) {
                $done();
            }
        },
        function(response) {
            //Second function handles error
            console.error("Received error from url " + url + " with error:" +  response.statustext);
            if ($done != null) {
                $done();
            }
        }
      );
  }

  this.next = function() {
      console.log("HuntQ size " + $localStorage.huntq.length);
      var q = $localStorage.huntq;

      if (q.length > 0) {
          var randomIndex = Math.floor(Math.random() * q.length);
          var hunts = q.splice(randomIndex, 1);
          console.log("HuntQ size after popping random hunt is " + $localStorage.huntq.length);
          var hunt = hunts[0];
          if (hunt.isFav == null) {
              hunt.isFav = false;
          }
          return hunt;
      }
      else {
          console.error("No hunts to show");
      }
      // build a healthy set of buffered hunts
      sync();
  }

});

console.log("App module created");