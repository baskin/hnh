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

    this.count = function() {
        return $localStorage.history.length;
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
      return hunt != null && hunt.id in $localStorage.bookmarks;
    }

    this.getAll = function() {
        var keys = Object.keys($localStorage.bookmarks);
        return keys.map(function(v) { return $localStorage.bookmarks[v]; });
    }

    this.count = function() {
        return Object.keys($localStorage.bookmarks).length;
    }

});


module.service('randomHuntService', function($http, $localStorage, bookmarksService) {

    var URL = "https://api.producthunt.com/v1/";
    var HEADER_OPTIONS = {
        headers: {
            "Authorization": "Bearer fbf62059f1556488e5354cd3892095e35ac776e93769efc2a446df35db8b7e6c"
        }
    };

    var HUNTQ_IDLE_SIZE = 25;
    var TRENDING_TOPICS_TTL_HOURS = 12;
    var FEATURED_COLLECTIONS_TTL_HOURS = 12;

    var defaultTopicIds = [208,  183, 192];

    $localStorage.$default({
        huntq: [],
        filter: {
            topics : [],
            collections : [],
            bookmarkedOnly : false,
            createdAfter : new Date(2012, 01, 01)
        },
        defaultTopics: [],
        trendingTopics: [],
        trendingTopicsUpdateTime: new Date(2012, 01, 01),
        featuredCollections: [],
        featuredCollectionsUpdateTime: new Date(2012, 01, 01)
    });

    this.featuredCollections = function($success, $failure) {
        var hoursAgo = Math.round((Date.now() - new Date($localStorage.featuredCollectionsUpdateTime))/(1000*60*60));
        if (hoursAgo > FEATURED_COLLECTIONS_TTL_HOURS) {
            var url = URL + "collections?search[featured]=true&sort_by=featured_at";
            var future = $http.get(url, HEADER_OPTIONS);
            future.then(
                function(response) {
                    console.log("Received success from url " + url);
                    var collections = response.data['collections'];
                    console.log("Fetched " + collections.length + " featured collections");
                    $localStorage.featuredCollections = [];
                    for (var i in collections) {
                        $localStorage.featuredCollections.push(toCollection(collections[i]));
                    }
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
            if ($success != null) {
                $success($localStorage.featuredCollections);
            }
        }
    }

    this.trendingTopics = function($success, $failure) {
        var hoursAgo = Math.round((Date.now() - new Date($localStorage.trendingTopicsUpdateTime))/(1000*60*60));
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
            if ($success != null) {
                $success($localStorage.trendingTopics);
            }
        }
    }

    var existsElementWithId = function(array, id) {
        for (var i in array) {
            if (array[i].id == id) {
                return true;
            }
        }
        return false;
    }

    this.defaultTopics = function($success, $failure) {
        var needsUpdate = false;
        for (var i in defaultTopicIds) {
            var id = defaultTopicIds[i];
            if (existsElementWithId($localStorage.defaultTopics, id)) {
                continue;
            }
            needsUpdate = true;
            var url = URL + "topics/" + id;
            var future = $http.get(url, HEADER_OPTIONS);
            future.then(
                function(response) {
                    var topic = response.data['topic'];
                    $localStorage.defaultTopics.push(topic);
                    if ($success != null) {
                        $success($localStorage.defaultTopics);
                    }
                },
                function(response) {
                    console.error("Received error: " +  response.statustext);
                    if ($failure != null) {
                        $failure();
                    }
                }
            );
        }
        if (!needsUpdate) {
            if ($success != null) {
                $success($localStorage.defaultTopics);
            }
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
        return (new Date(hunt.created_at).getTime() >= new Date(createdAfter).getTime());
    }

    var bookmarkFilterOk = function(hunt, bookmarkedOnly) {
        if (!bookmarkedOnly) {
            return true;
        }
        return bookmarksService.has(hunt);
    }

    var collectionFilterOk = function(hunt, collections) {
        if (collections.length == 0) {
            return true; // nothing to filter
        }
        return false;
    }

     // private
    var include = function(hunt, filter, ignoreCollectionFilter) {
      var included = (dateFilterOk(hunt, filter.createdAfter) && topicFilterOk(hunt, filter.topics) && bookmarkFilterOk(hunt, filter.bookmarkedOnly));
      return ignoreCollectionFilter ? included : (included && collectionFilterOk(hunt, filter.collections));
    }

    var applyFilterInner = function(filter, ignoreCollectionFilter) {
        console.log("Applying filter {topics:" + filter.topics.length + ", collections:" + filter.collections.length 
          + ", created_after:" + filter.createdAfter + ", bookmarked:" + filter.bookmarkedOnly + "} on huntq");
        var huntQ = $localStorage.huntq;
        var updatedHuntQ = []
        for(var i in huntQ) {
            if (include(huntQ[i], filter, ignoreCollectionFilter)) {
                updatedHuntQ.push(huntQ[i]);
            }
        }
        console.log("Reduced HuntQ size from " + $localStorage.huntq.length + " to " + updatedHuntQ.length);
        $localStorage.huntq = updatedHuntQ;
    }

    this.setFilter = function(type, filter) {
        console.log("Setting filter of type " + type + ":" + filter);
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

      if ($localStorage.filter.bookmarkedOnly) {
          $localStorage.huntq = bookmarksService.getAll();
          console.log("New HuntQ size " + $localStorage.huntq.length);
          applyFilterInner($localStorage.filter);
          if ($done != null) {
              $done();
          }
          return;
      }


      if ($localStorage.filter.collections.length > 0) {
          // TODO support multiple collections
          url = URL + "collections/" + $localStorage.filter.collections[0].id;
          fromCollections = true;
      }
      else if ($localStorage.filter.topics.length > 0) {
          // TODO support multiple topics
          url = URL + "posts/all?search[topic]=" + $localStorage.filter.topics[0].id;
          reduceResponseSize = true;
      }
      else {
          reduceResponseSize = true;
          var daysBetween = Math.round((Date.now() - new Date($localStorage.filter.createdAfter))/(1000*60*60*24));
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
            for (i in body) {
                $localStorage.huntq.push(toHunt(body[i]));
            }
            if (fromCollections) {
                // apply filter and ignore collections filter
                applyFilterInner($localStorage.filter, true);
            }
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

  var toHunt = function(detail) {
      hunt = {};
      hunt.id = detail.id;
      hunt.name = detail.name;
      hunt.tagline = detail.tagline;
      hunt.topics = detail.topics;
      hunt.votes_count = detail.votes_count;
      hunt.created_at = detail.created_at;
      hunt.thumbnail = detail.thumbnail;
      hunt.redirect_url = detail.redirect_url;
      hunt.comments_count = detail.comments_count;
      var hasAudio = hunt.thumbnail.media_type == 'audio';
      if (hasAudio) {
          var audioUrl = hunt.thumbnail.metadata.url;
          if (audioUrl.startsWith("http:")) {
              audioUrl = audioUrl.replace("http", "https");
          }
      }
      hunt.hasAudio = hasAudio;
      hunt.audioUrl = audioUrl;
      return hunt;
  }

  var toCollection = function(detail) {
      collection = {};
      collection.id = detail.id;
      collection.name = detail.name;
      collection.title = detail.title;
      collection.subscriber_count = detail.subscriber_count;
      collection.featured_at = detail.featured_at;
      collection.created_at = detail.created_at;
      collection.posts_count = detail.posts_count;
      collection.background_image_url = detail.background_image_url;
      return collection;
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
          console.error("No hunts to show. Try changing the filters or connecting to the internet");
      }
      // build a healthy set of buffered hunts
      this.sync();
      return hunt;
  }
});

console.log("App module created");