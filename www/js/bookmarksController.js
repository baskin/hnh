module.controller('bookmarksController', function($scope, bookmarksService, historyService) {

    console.log("BookmarksController loaded");
    $scope.allBookmarks = bookmarksService.getAll();
    $scope.allHistory = historyService.getAll();
    $scope.historyMaxSize = historyService.maxSize();

    $scope.addBookmark = function($hunt) {
        bookmarksService.add($hunt);
    }

    $scope.removeBookmark = function($hunt) {
        bookmarksService.remove($hunt);
    }

    $scope.isBookmarked = function($hunt) {
        return bookmarksService.has($hunt);
    }

    $scope.applyHistorySize = function(sz) {
        historyService.applyHistorySize(sz);
        // history might have changed, so reload
        $scope.allHistory = historyService.getAll();
    }

});