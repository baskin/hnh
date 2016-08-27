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

    var HUNTQ_IDLE_SIZE = 25;
    $localStorage.$default({
        huntq: [],
        filter: {
            topics : [],
            createdAfter : new Date(2014, 01, 01).toISOString()
        }
    });

    var topicFilterOk = function(hunt, topics) {
        // topic filter
        // "topics":[{"id":68,"name":"Video Streaming","slug":"video-streaming"},{"id":2,"name":"Android","slug":"android"}]
        if (topics.length == 0) {
            return true; // nothing to filter
        }
        for (var i in hunt.topics) {
            for (var j in topics) {
                if (hunt.topics[i].id == topics[j].id) {
                    return true;
                }
            }
        }
        return false;
    }

    var dateFilterOk = function(hunt, createdAfter) {
        return (new Date(hunt.created_at).getTime() >= new Date(createdAfter).getTime());
    }

     // private
    this.include = function(hunt, filter) {
      if (dateFilterOk(hunt, filter.createdAfter) && topicFilterOk(hunt, filter.topics)) {
          return true;
      }
      return false;
    }

    // private
    this.applyFilter = function(filter) {
        console.log("Applying filter " + filter + " on huntq");
        var huntQ = $localStorage.huntq;
        var updatedHuntQ = []
        for(var i in huntQ) {
            if (this.include(huntQ[i], filter)) {
                updatedHuntQ.push(huntQ[i]);
            }
        }
        console.log("Reduced HuntQ size from " + $localStorage.huntq.length + " to " + updatedHuntQ.length);
        $localStorage.huntq = updatedHuntQ;
        this.sync();
    }

    this.setFilter = function(type, filter) {
        console.log("Setting filter of type " + type);
        $localStorage.filter[type] = filter;
        this.applyFilter($localStorage.filter)
    }

    var shufffle = function(a) {
      var j, x, i;
      for (i = a.length; i; i--) {
          j = Math.floor(Math.random() * i);
          x = a[i - 1];
          a[i - 1] = a[j];
          a[j] = x;
      }
    }


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
      if ($localStorage.filter.topics.length > 0) {
          url = url + "/all?search[topic]=" + $localStorage.filter.topics[0].id; // 208;
      }
      else {
          // daysBetween = 365
          var daysBetween = Math.round((Date.now() - new Date($localStorage.filter.createdAfter))/(1000*60*60*24));
          var daysAgo = Math.floor(Math.random() * daysBetween);
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
            shufffle(body);
            body = body.slice(0, 10); // reduce size from single response
            console.log("Retained " + body.length + " random hunts");
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

      var hunt = null;
      if (q.length > 0) {
          var randomIndex = Math.floor(Math.random() * q.length);
          var hunts = q.splice(randomIndex, 1);
          console.log("HuntQ size after popping random hunt is " + $localStorage.huntq.length);
          var hunt = hunts[0];
          if (hunt.isFav == null) {
              hunt.isFav = false;
          }
      }
      else {
          console.error("No hunts to show");
      }
      // build a healthy set of buffered hunts
      this.sync();
      return hunt;
  }
});

console.log("App module created");