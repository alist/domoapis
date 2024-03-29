'use strict';

/* Services */


angular.module('domo.services', ['ngResource']).
  factory('User', function($resource){
    return $resource('/api/v1/organizations/:organization/users/:userId?token=' + encodeURIComponent(token) + '&clientId=web', null, {
      query: {
        method: 'GET',
        transformRequest: function(data, headersGetter) {
          console.log(data)
        }
      }
    });
  }).
  factory('UserRole', function($resource){
    return $resource('/api/v1/organizations/:organization/users/:userId/roles/:role?token=' + encodeURIComponent(token) + '&clientId=web', null, {
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