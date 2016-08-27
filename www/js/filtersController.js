module.controller('filtersController', function($scope, randomHuntService) {

    console.log("Filters loaded");
    randomHuntService.setFilter("topics", [{"id":68}]);
});