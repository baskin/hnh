module.controller('appController', function($scope, $localStorage, $sessionStorage) {

  $scope.$storage = $localStorage;
  $scope.$storage = $localStorage.$default({
      huntq: [],
      history: [],
      // bookmarks: {}
  });
});

ons.ready(function() {
    console.log("AppController loaded");
  }
);