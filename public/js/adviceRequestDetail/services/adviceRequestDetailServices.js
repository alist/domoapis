angular.module('adviceRequestDetail',['ngResource']).
    factory('ADetailRequests', function($resource){
        resourceRequestPath = "../adviceRequest/" + window.advicerequestId;
        window.resourceRequestPath = resourceRequestPath
        return $resource(resourceRequestPath, {},{
            get: 
              {
                method: 'GET', 
                isArray:false,
                cache: true

              }
        });
    }).

  config(function($routeProvider) {
    $routeProvider.
      when('*', {controller:adviceRequestDetailController, templateUrl:'/partials/adviceRequestListingPartial.html'});
  });
 
