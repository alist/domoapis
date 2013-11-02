angular.module('adviceRequest',['ngResource']).
    factory('ARequests', function($resource){
    	console.log("adviceRequest.js");
        return $resource('./adviceRequest', {},{
            get: {method: 'GET', isArray:false}
        });
    }).
  config(function($routeProvider) {
    $routeProvider.
      when('*', {controller:adviceRequestController, templateUrl:'/partials/adviceRequestListingPartial.html'});
      //.when('/edit/:projectId', {controller:EditCtrl, templateUrl:'detail.html'}) 
  });
 
