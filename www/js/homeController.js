
module.controller('homeController', function($scope, $http, $location, randomHuntService, historyService, bookmarksService) {

  $scope.updateModel = function(hunt, $done) {
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
      if (null != $done) {
          console.log("Calling callback done()")
          $done();
      }
  }

  $scope.resetModel = function() {
      $scope.randomhunt = null;
  }

  $scope.nextHunt = function($done, $delay) {
      // Introduce optional artifical delay to 'look' like 
      // hunt is being fetched online.
      $delay = $delay || 0;
      setTimeout(function() { 
          var hunt = randomHuntService.next();
          historyService.add(hunt);
          $scope.updateModel(hunt, $done);
          $scope.showFab = true;
      }, $delay);
  }

  $scope.addBookmark = function($hunt) {
      bookmarksService.add($hunt);
  }

  $scope.removeBookmark = function($hunt) {
      bookmarksService.remove($hunt);
  }

  $scope.isBookmarked = function($hunt) {
      return bookmarksService.has($hunt);
  }

  $scope.gotoHunt = function($hunt) {
      console.log("Navigating to hunt " + $hunt.redirect_url);
      $scope.randomhunt = $hunt;
      $scope.nav.pushPage('hunt.html');
  }

  $scope.pullHookStateChanged = function($event) {
      $scope.showFab = false; 
      console.log("pull hook state changed:" + $event.state);
  }

  ons.ready(function() {
      console.log("HomeController loaded");
      console.log("Custom data passed: " + $scope.nav.topPage.data);
      
      if ($scope.nav.topPage.data != null && $scope.nav.topPage.data.randomhunt != null) {
          $scope.updateModel($scope.nav.topPage.data.randomhunt);
      }
      else {
          $scope.nextHunt();
      }
  });
});
