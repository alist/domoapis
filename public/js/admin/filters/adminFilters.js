'use strict';

/* Filters */

angular.module('domo.filters', []).
  filter('arrayToCSV', function() {
    return function(input) {
      return input.sort().join(", ");
    }
  })