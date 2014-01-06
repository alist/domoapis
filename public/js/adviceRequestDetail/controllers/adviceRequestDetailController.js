//adviceRequestDetailController.js

function adviceRequestDetailController($scope, ADetailRequests) {
    $scope.advicerequest = null

    $scope.loadResource = function() {
      ADetailRequests.get({},function(u, getResponseHeaders){
          $scope.advicerequest = u.response.advicerequest;
      });
    }

    $scope.$watch('advicerequest', function( newValue, oldValue ) {
	        if ( newValue === oldValue ) {
	            return;
	        }

	        $scope.advicerequest = newValue;
	    });

    $scope.loadResource()

	window.adviceRequestScope = $scope;


}
