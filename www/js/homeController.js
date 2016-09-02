
module.controller('homeController', function($scope, $http, $location, randomHuntService, historyService, bookmarksService) {

  $scope.updateModel = function(hunt, $done) {
      historyService.add(hunt);
      $scope.randomhunt = hunt;
      if (null != $done) {
          $done();
      }
  }

  $scope.resetModel = function() {
      $scope.randomhunt = null;
  }

  $scope.nextHunt = function($done, $delay) {
      // Introduce optional artifical delay to 'look' like 
      // hunt is being fetched online.
      $scope.summaryImageClass = "loading";
      $delay = $delay || 0;
      setTimeout(function() { 
          var hunt = randomHuntService.next();
          if (hunt != null) {
              $scope.error = false;
              $scope.updateModel(hunt, $done);
              $scope.showFab = true;
          }
          else {
              $scope.error = true;
              if ($done != null) {
                  $done();
              }
          }
      }, $delay);
  }

  $scope.huntImageLoaded = function() {
      console.log("Hunt image loaded. Removing loading animation");
      $scope.summaryImageClass = "";
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
      // console.log("pull hook state changed:" + $event.state);
  }

  ons.ready(function() {
      console.log("HomeController loaded");
      $scope.historyCount = historyService.count();
      $scope.bookmarkCount = bookmarksService.count();
      
      if ($scope.nav.topPage.data != null && $scope.nav.topPage.data.randomhunt != null) {
          var hunt = $scope.nav.topPage.data.randomhunt;
          $scope.updateModel(hunt);
          $scope.showFab = true;
      }
      else {
          $scope.nextHunt();
      }
  });
});
