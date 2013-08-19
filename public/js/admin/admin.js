'use strict';


// Declare app level module which depends on filters, and services
angular.module('domo', ['domo.filters', 'domo.services', 'domo.directives', 'domo.controllers']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/users', { templateUrl: '/partials/adminUserList', controller: 'UserListController' });
    $routeProvider.when('/users/:userId', { templateUrl: '/partials/adminUserForm', controller: 'UserController' });
    $routeProvider.otherwise({redirectTo: '/users'});
  }]);