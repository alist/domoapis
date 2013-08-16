'use strict';

/* Controllers */

angular.module('domo.controllers', ['domo.services']).
  controller('UserController', ['$scope', 'User', function($scope, User) {

    $scope.orderProp = 'joined';
    $scope.response = User.get({ organization: organization }, function(res) {
      $scope.users = res.response.users;
    });

  }]);