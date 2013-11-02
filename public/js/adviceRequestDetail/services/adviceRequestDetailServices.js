angular.module('adviceRequestDetail',['ngResource']).
    factory('ADetailRequests', function($resource){
        requestPath = "../adviceRequest/" + window.advicerequestId;
        return $resource(requestPath, {},{
            get: {method: 'GET', isArray:false}
        });
    }).
  config(function($routeProvider) {
    $routeProvider.
      when('*', {controller:adviceRequestDetailController, templateUrl:'/partials/adviceRequestListingPartial.html'});
  });
 
