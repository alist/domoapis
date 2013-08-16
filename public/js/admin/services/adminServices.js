'use strict';

/* Services */


angular.module('domo.services', ['ngResource']).
  factory('User', function($resource){
    return $resource('/api/v1/organizations/:organization/users', {}, {
      query: {
        method: 'GET', 
        params: { organization: organization }
      }
    });
  });