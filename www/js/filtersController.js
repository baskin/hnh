module.controller('filtersController', function($scope, randomHuntService, bookmarksService) {

    randomHuntService.trendingTopics(function(topics) {
    	$scope.trendingTopics = topics;
    });
    $scope.filteredTopics = randomHuntService.getFilter("topics");


    randomHuntService.featuredCollections(function(collections) {
    	$scope.featuredCollections = collections;
    });
    $scope.filteredCollections = randomHuntService.getFilter("collections");

    $scope.createdAfter = new Date(randomHuntService.getFilter("createdAfter"));
    $scope.maxFilterDate = new Date(Date.now());

    $scope.bookmarksCount = bookmarksService.count();
    $scope.bookmarkedOnly = randomHuntService.getFilter("bookmarkedOnly");

    $scope.applyFilter = function(createdAfter, bookmarkedOnly) {
        randomHuntService.setFilter("createdAfter", createdAfter);
        console.log("value of bookmarkedOnly:" + bookmarkedOnly);
        randomHuntService.setFilter("bookmarkedOnly", bookmarkedOnly);
        randomHuntService.applyFilter();
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