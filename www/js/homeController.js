
module.controller('homeController', function($scope, $http, $location) {

  $scope.useHunt = function(hunt) {
      $scope.randomhunt = hunt;
      var hasAudio = hunt.thumbnail.media_type == 'audio';
      if (hasAudio) {
          var audioUrl = hunt.thumbnail.metadata.url;
          console.log("Audio meta detected " + audioUrl);
          if (audioUrl.startsWith("http:")) {
              audioUrl = audioUrl.replace("http", "https");
              console.log("Will try to use https instead of http " + audioUrl);
          }
      }
      $scope.randomhunt.hasAudio = hasAudio;
      $scope.randomhunt.audioUrl = audioUrl;
  }

  $scope.nextHunt = function($done, $delay) {
      // Introduce optional artifical delay to 'look' like 
      // hunt is being fetched online.
      $delay = $delay || 0;
      setTimeout(function() { 
          $scope.nextHuntInner($done);
      }, $delay);
  }

  $scope.nextHuntInner = function($done) {
      console.log("HuntQ size " + $scope.$storage.huntq.length);
      var q = $scope.$storage.huntq;

      if (q.length > 0) {
          var randomIndex = Math.floor(Math.random() * q.length);
          var hunts = q.splice(randomIndex, 1);
          console.log("HuntQ size after popping random hunt is " + $scope.$storage.huntq.length);
          var hunt = hunts[0];
          $scope.$storage.history.unshift(hunt);
          if ($scope.$storage.history.length > 25) {
              // history size full, pop
              $scope.$storage.history.pop();
          }
          $scope.useHunt(hunt);
      }
      else {
          console.error("No hunts to show");
      }
      if (q.length < 100) {
          // build a healthy set of buffered hunts
          $scope.updateHuntQ();
      }
      if (null != $done) {
          console.log("Calling callback done()")
          $done();
      }
  }

  $scope.updateHuntQ = function($done) {
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
        headers: {"Authorization":"Bearer fbf62059f1556488e5354cd3892095e35ac776e93769efc2a446df35db8b7e6c"}
      };

      $http.get(url, headerOptions).then(
        function(response) {
          console.log("Received success from url " + url);
            // First function handles success
            body = response.data['posts'];
            console.log("Fetched " + body.length + " hunts");
            $scope.$storage.huntq = $scope.$storage.huntq.concat(body);
            console.log("New HuntQ size " + $scope.$storage.huntq.length);
            if ($done != null) {
                $done();
            }
        },
        function(response) {
            //Second function handles error
            console.error("Received error from url " + url + " with error:" +  response.statustext);
        }
      );
  }

  $scope.gotoHunt = function($hunt) {
      console.log("Navigating to hunt " + $hunt.redirect_url);
      $scope.randomhunt = $hunt;
      $scope.nav.pushPage('hunt.html');
  }

  $scope.go = function(path) {
      console.log("going to path " + path);
      $location.path( path );
  };

  ons.ready(function() {
      console.log("HomeController ready");
      console.log("Loaded HuntQ with size " + $scope.$storage.huntq.length);
      console.log("Custom data passed: " + $scope.nav.topPage.data);
      
      if ($scope.nav.topPage.data != null && $scope.nav.topPage.data.randomhunt != null) {
          $scope.useHunt($scope.nav.topPage.data.randomhunt);
      }
      else {
        if ($scope.$storage.huntq.length < 100) {
            $scope.updateHuntQ($scope.nextHunt());
        }
        else {
          $scope.nextHunt();
        }
      }
  });
});
