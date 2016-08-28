module.controller('filtersController', function($scope, randomHuntService) {

    randomHuntService.trendingTopics(function(topics) {
    	$scope.trendingTopics = topics;
    });
    $scope.filteredTopics = randomHuntService.getFilter("topics");


    randomHuntService.featuredCollections(function(collections) {
    	$scope.featuredCollections = collections;
    });
    $scope.filteredCollections = [randomHuntService.getFilter("collection")];

    $scope.createdAfter = new Date(randomHuntService.getFilter("createdAfter"));
    $scope.maxFilterDate = new Date(Date.now());

    $scope.applyFilters = function() {
    	randomHuntService.setFilter("topics", $scope.filteredTopics);
    	randomHuntService.setFilter("collections", $scope.filteredCollections);
    	randomHuntService.setFilter("createdAfter", $scope.createdAfter);
    }

    $scope.push2ArrayUnique = function(array, element, maxsize) {
    	for (var i in array) {
    		if (array[i].id == element.id) {
    			return;
    		}
    	}
    	if (array.length == maxsize) {
    		array.pop();
    	}
    	array.push(element);
    }

	console.log("filtersController loaded");
});