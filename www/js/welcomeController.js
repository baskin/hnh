module.controller('welcomeController', function($scope) {

    console.log("WelcomeController loaded");
    var configure = ($scope.nav.topPage.data != null && $scope.nav.topPage.data.configure == true) || $scope.$storage.username == null;
    $scope.configure = configure;
    $scope.username = $scope.$storage.username;
    if (!configure) {
        console.log("Skipping welcome configuration");
        setTimeout(function() {
            $scope.nav.pushPage('home.html');
        }, 2000);
    }
});