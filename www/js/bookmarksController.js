module.controller('bookmarksController', function($scope, bookmarksService) {

    console.log("BookmarksController loaded");
    $scope.allBookmarks = bookmarksService.getAll();

    $scope.addBookmark = function($hunt) {
        bookmarksService.add($hunt);
    }

    $scope.removeBookmark = function($hunt) {
        bookmarksService.remove($hunt);
    }

    $scope.isBookmarked = function($hunt) {
        return bookmarksService.has($hunt);
    }

});