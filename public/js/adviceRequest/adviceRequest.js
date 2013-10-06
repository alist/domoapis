angular.module('adviceRequest',['ngResource']).
    factory('ARequests', function($resource){
    	console.log("adviceRequest.js");
        return $resource('/mit/adviceRequest', {},{
            get: {method: 'GET', isArray:false}
        });
    });
 
