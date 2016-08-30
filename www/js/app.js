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

module.directive('imageonload', function() {
    return {
        restrict: 'A',
        scope: {
            ngSrc: '@'
        },
        link: function(scope, element) {
          element.on('load', function() {
              // Set visibility: true + remove spinner overlay
              element.removeClass('image-hide');
              element.addClass('image-show');
              element.parent().find('span').removeClass('image-show');
              element.parent().find('span').addClass('image-hide');
              console.log("Summary image loaded");
          });
          scope.$watch('ngSrc', function() {
              // Set visibility: false + inject temporary spinner overlay
              element.parent().find('span').addClass('image-show');
              element.parent().find('span').removeClass('image-hide');
              element.addClass('image-hide');
              element.removeClass('image-show');
              console.log("Summary image src changed");
          });
        }
    };
});

module.service('historyService', function($localStorage) {

    $localStorage.$default({
        history: [],
        historyMaxSize: 25
    });

    this.add = function(hunt) {
        var h = $localStorage.history;
        // Remove the older occurance of hunt
        var removeIndex = -1;
        for (var i = 0; i < h.length; i++) {
            if (h[i].id == hunt.id) {
                removeIndex = i;
                break;
            }
        }
        if (removeIndex != -1) {
            h.splice(removeIndex, 1);
        }
        // push to front
        h.unshift(hunt);
        if (h.length > this.maxSize()) {
            // history size full, pop
            h.pop();
        }
        $localStorage.history = h;
    }

    this.getAll = function() {
        return $localStorage.history;
    }

    this.maxSize = function() {
        return $localStorage.historyMaxSize;
    }

    this.applyHistorySize = function(sz) {
        if (sz < $localStorage.history.length) {
            // trim down history
            console.log("Trimming history to sz:" + sz);
            $localStorage.history = $localStorage.history.slice(0, sz);
        }
        $localStorage.historyMaxSize = sz;
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

    var URL = "https://api.producthunt.com/v1/";
    var HEADER_OPTIONS = {
        headers: {
            "Authorization": "Bearer fbf62059f1556488e5354cd3892095e35ac776e93769efc2a446df35db8b7e6c"
        }
    };

    var HUNTQ_IDLE_SIZE = 25;
    var TRENDING_TOPICS_TTL_HOURS = 12;
    var FEATURED_COLLECTIONS_TTL_HOURS = 12;

    $localStorage.$default({
        huntq: [],
        filter: {
            topics : [],
            collections : [],
            createdAfter : new Date(2015, 01, 01)
        },
        trendingTopics: [],
        trendingTopicsUpdateTime: new Date(2015, 01, 01),
        featuredCollections: [],
        featuredCollectionsUpdateTime: new Date(2015, 01, 01)
    });

    this.featuredCollections = function($success, $failure) {
        var hoursAgo = Math.round((Date.now() - $localStorage.featuredCollectionsUpdateTime)/(1000*60*60));
        if (hoursAgo > FEATURED_COLLECTIONS_TTL_HOURS) {
            var url = URL + "collections?search[featured]=true&sort_by=featured_at";
            var future = $http.get(url, HEADER_OPTIONS);
            future.then(
                function(response) {
                    console.log("Received success from url " + url);
                    var collections = response.data['collections'];
                    console.log("Fetched " + collections.length + " featured collections");
                    $localStorage.featuredCollections = collections;
                    $localStorage.featuredCollectionsUpdateTime = new Date(Date.now());
                    if ($success != null) {
                        $success(collections);
                    }
                },
                function(response) {
                    console.error("Received error from url " + url + " with error:" +  response.statustext);
                    if ($failure != null) {
                        $failure();
                    }
                }
            );
        }
        else {
            return $success($localStorage.featuredCollections);
        }
    }

    this.trendingTopics = function($success, $failure) {
        var hoursAgo = Math.round((Date.now() - $localStorage.trendingTopicsUpdateTime)/(1000*60*60));
        if (hoursAgo > TRENDING_TOPICS_TTL_HOURS) {
            var url = URL + "topics?search[trending]=true";
            var future = $http.get(url, HEADER_OPTIONS);
            future.then(
                function(response) {
                    console.log("Received success from url " + url);
                    var topics = response.data['topics'];
                    console.log("Fetched " + topics.length + " trending topics");
                    $localStorage.trendingTopics = topics;
                    $localStorage.trendingTopicsUpdateTime = new Date(Date.now());
                    if ($success != null) {
                        $success(topics);
                    }
                },
                function(response) {
                    console.error("Received error from url " + url + " with error:" +  response.statustext);
                    if ($failure != null) {
                        $failure();
                    }
                }
            );
        }
        else {
            return $success($localStorage.trendingTopics);
        }
    }

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
        return (new Date(hunt.created_at).getTime() >= createdAfter.getTime());
    }

    var collectionFilterOk = function(hunt, collections) {
        if (collections.length == 0) {
            return true; // nothing to filter
        }
        return false;
    }

     // private
    var include = function(hunt, filter) {
      if (dateFilterOk(hunt, filter.createdAfter) && topicFilterOk(hunt, filter.topics) && collectionFilterOk(hunt, filter.collections)) {
          return true;
      }
      return false;
    }

    var applyFilterInner = function(filter) {
        console.log("Applying filter {" + filter.topics + ", " + filter.collections + ", " + filter.createdAfter + "} on huntq");
        var huntQ = $localStorage.huntq;
        var updatedHuntQ = []
        for(var i in huntQ) {
            if (include(huntQ[i], filter)) {
                updatedHuntQ.push(huntQ[i]);
            }
        }
        console.log("Reduced HuntQ size from " + $localStorage.huntq.length + " to " + updatedHuntQ.length);
        $localStorage.huntq = updatedHuntQ;
    }

    this.setFilter = function(type, filter) {
        console.log("Setting filter of type " + type);
        $localStorage.filter[type] = filter;
    }

    this.applyFilter = function(type, filter) {
        applyFilterInner($localStorage.filter);
        this.sync();
    }

    this.getFilter = function(type) {
        return $localStorage.filter[type];
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
      var url = "";
      var reduceResponseSize = false;
      var fromCollections = false;
      if ($localStorage.filter.collections.length > 0) {
          url = URL + "collections/" + $localStorage.filter.collections[0].id;
          fromCollections = true;
      }
      else if ($localStorage.filter.topics.length > 0) {
          url = URL + "posts/all?search[topic]=" + $localStorage.filter.topics[0].id;
          reduceResponseSize = true;
      }
      else {
          reduceResponseSize = true;
          var daysBetween = Math.round((Date.now() - $localStorage.filter.createdAfter)/(1000*60*60*24));
          var daysAgo = Math.floor(Math.random() * daysBetween);
          url = URL + "posts?days_ago=" + daysAgo;
      }

      $http.get(url, HEADER_OPTIONS).then(
        function(response) {
            console.log("Received success from url " + url);
            // First function handles success
            body = response.data['posts'];
            if (fromCollections) {
                body = response.data['collection']['posts'];
            }
            console.log("Fetched " + body.length + " hunts");
            shufffle(body);
            // reduce size from single response
            // TODO first remove read hunts.
            if (reduceResponseSize) {
                body = body.slice(0, 10);
                console.log("Retained " + body.length + " random hunts");
            }
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