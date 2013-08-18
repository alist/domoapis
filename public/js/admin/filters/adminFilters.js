'use strict';

/* Filters */

angular.module('domo.filters', []).
  filter('arrayToCSV', function() {
    return function(input) {
      return Object.keys(input).sort().join(', ');
    }
  })