//adviceRequestDetailController.js

function adviceRequestDetailController($scope, ADetailRequests) {
    $scope.advicerequest = null

    $scope.loadResource = function() {
      ADetailRequests.get({},function(u, getResponseHeaders){
          $scope.advicerequest = u.response.advicerequest;
      });
    }

    $scope.loadResource()

	window.adviceRequestScope = $scope;


}
