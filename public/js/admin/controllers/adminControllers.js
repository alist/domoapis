'use strict';

/* Controllers */

angular.module('domo.controllers', ['domo.services']).
  controller('UserController', ['$scope', 'User', function($scope, User) {

    $scope.orderProp = '-joined';
    $scope.users = [];
    $scope.validRoles = [];
    $scope.roleFilter = null;

    $scope.filterByRole = function(user) {
      if(!$scope.roleFilter) {
        return user;
      }
      return (Object.keys(user.roles).indexOf($scope.roleFilter) > -1);
    };

    $scope.response = User.get({ organization: organization }, function(res) {
      $scope.users = res.response.users;
      angular.forEach($scope.users, function(u, k) {
        angular.forEach(Object.keys(u.roles), function(v) {
          if($scope.validRoles.indexOf(v) < 0) {
            $scope.validRoles.push(v);
          }
        });
      });

    });

  }]);