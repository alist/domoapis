'use strict';


// Declare app level module which depends on filters, and services
angular.module('domo', ['domo.filters', 'domo.services', 'domo.directives', 'domo.controllers']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/users', { templateUrl: '/partials/userList', controller: 'UserController' });
    $routeProvider.otherwise({redirectTo: '/users'});
  }]);