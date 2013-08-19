'use strict';

/* Filters */

angular.module('domo.filters', []).
  filter('userRoleList', function() {
    return function(user) {

      if(!user.accApproved) {
        return '[PENDING APPROVAL]';
      }

      var roles = user.roles;
      if(typeof roles !== 'object') {
        return '';
      }
      return Object.keys(roles).sort().join(', ');
    }
  })