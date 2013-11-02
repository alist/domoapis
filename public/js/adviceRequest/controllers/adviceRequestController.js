//adviceRequestController.js

function adviceRequestController($scope, ARequests) {
    $scope.responseData = []
    ARequests.get({},function(u, getResponseHeaders){
        $scope.responseData = u.response.advicerequests;
    });

    //requests = $scope.responseData.response.advicerequests;
    //console.log(requests);

	window.adviceRequestScope = $scope;

  /* $scope.spices = [{"name":"pasilla", "spiciness":"mild"},
                  {"name":"jalapeno", "spiceiness":"hot hot hot!"},
                  {"name":"habanero", "spiceness":"LAVA HOT!!"}];
 
   $scope.spice = "habanero";
   */ //who cares?
}
