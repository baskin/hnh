module.controller('appController', function($scope, $localStorage, $sessionStorage, randomHuntService) {
    $scope.$storage = $localStorage;
    randomHuntService.sync();
});

ons.ready(function() {
    console.log("AppController loaded");
});