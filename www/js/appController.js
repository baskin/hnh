module.controller('appController', function($scope, $localStorage, $sessionStorage, randomHuntService) {
    $scope.$storage = $localStorage;
    randomHuntService.sync();
    randomHuntService.featuredCollections()
    randomHuntService.trendingTopics();
    randomHuntService.defaultTopics();
});

ons.ready(function() {
    console.log("AppController loaded");
});