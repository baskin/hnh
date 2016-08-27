module.controller('huntController', function($scope, $location) {

    console.log("HuntController loaded");
    $scope.randomhunt = $scope.nav.topPage.data.randomhunt;

    $scope.go = function(path) {
	      console.log("going to path " + path);
	      $location.path(path);
    };
});