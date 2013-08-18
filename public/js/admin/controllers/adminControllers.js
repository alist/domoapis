'use strict';

/* Controllers */

var adminModule = angular.module('domo.controllers', ['domo.services']);

adminModule.controller('UserListController', ['$scope', '$location', 'User', 'Shared', 
    function($scope, $location, User, Shared) {

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

      $scope.showUserDetails = function(user) {
        $location.path('/users/' + user._id);
      }

      $scope.response = User.query({ organization: organization }, function(res) {
        $scope.users = res.response.users;
        var validRoles = $scope.validRoles;
        angular.forEach($scope.users, function(u, k) {
          if(typeof u.roles !== 'object')   return;
          angular.forEach(Object.keys(u.roles), function(v) {
            if(validRoles.indexOf(v) < 0) {
              validRoles.push(v);
            }
          });
        });
        
        $scope.validRoles = validRoles;
      });

    }]);


adminModule.controller('UserController', ['$scope', '$routeParams', '$location', 'User', 'UserRole', 'Shared', 
    function($scope, $routeParams, $location, User, UserRole, Shared) {

      $scope.user = null;
      $scope.newRole = null;

      $scope.addDisabled = false;
      $scope.delDisabled = false;
      $scope.delUserDisabled = false;

      $scope.response = User.get({ organization: organization, userId: $routeParams.userId  }, function(res) {
        $scope.user = res.response.user;
      },
      function(err) {
        console.log(err);
      });

      $scope.addRole = function(user) {
        $scope.addDisabled = true;

        var newRole = {};
        newRole[$scope.newRole] = {};

        UserRole.save({ organization: organization, userId: $routeParams.userId, role: $scope.newRole }, newRole, function(res) {
          $scope.addDisabled = false;
          $scope.newRole = null;
          $scope.user = res.response.user;
        },
        function(err) {
          console.log(err.data);
          alert(err.data.errors.join(' '));
          $scope.addDisabled = false;
        });
      }

      $scope.deleteRole = function(role, user) {
        $scope.delDisabled = true;
        UserRole.remove({ organization: organization, userId: $routeParams.userId, role: role }, function(res) {
          $scope.delDisabled = false;
          $scope.user = res.response.user;
        },
        function(err) {
          console.log(err.data);
          alert(err.data.errors.join(' '));
          $scope.delDisabled = false;
        });
      }


      $scope.deleteUser = function(user) {
        $scope.delUserDisabled = true;
        User.remove({ organization: organization, userId: user._id }, function(res) {
          console.log(res)
          $scope.delUserDisabled = false;
          $scope.user = null;
          $location.path('/users');
        },
        function(err) {
          console.log(err.data);
          alert(err.data.errors.join(' '));
          $scope.delUserDisabled = false;
        });
      }

    }]);