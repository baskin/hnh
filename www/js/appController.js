module.controller('appController', function($scope, $localStorage, $sessionStorage) {

  $scope.$storage = $localStorage;
  $scope.$storage = $localStorage.$default({
      huntq: [],
      history: []
  });
  console.log("Stored username " + $localStorage.username);
  $scope.$firstpage = $scope.$storage.username == null ? "welcome.html" : "home.html";
});

ons.ready(function() {
    console.log("AppController ready");
  }
);