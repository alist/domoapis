//adviceRequestDetailController.js

function adviceRequestDetailController($scope, ADetailRequests) {
    $scope.advicerequest = null
    ADetailRequests.get({},function(u, getResponseHeaders){
        $scope.advicerequest = u.response.advicerequest;
    });


	window.adviceRequestScope = $scope;


}
