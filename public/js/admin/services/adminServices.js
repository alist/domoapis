'use strict';

/* Services */


angular.module('domo.services', ['ngResource']).
  factory('User', function($resource){
    return $resource('/api/v1/organizations/:organization/users/:userId', null, {
      query: { method: 'GET' },
    });
  }).
  factory('UserRole', function($resource){
    return $resource('/api/v1/organizations/:organization/users/:userId/roles/:role', null, {
      query: { method: 'GET' },
    });
  }).
  factory('Shared', function() {  
    return {
      pageAttrs : {
        pageHeader : 'x'
      }
    };
  });