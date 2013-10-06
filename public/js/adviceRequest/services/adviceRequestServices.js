//adviceRequestServices.js

angular.module('adviceRequestServices', ['ngResource']).
    factory('adviceRequestResource', function ($resource) {
        var AdviceRequestResource = $resource('https://api.mongolab.com/api/1/databases' +
                '/johnlindquist/collections/star-trek/',
                {apiKey:'4f0f9e96e4b04ac27016b99a'},
                {monogolabQuery:{method:'GET', params:{q:""}, isArray:true}});


        AdviceRequestResource.prototype.getCrewByStarship = function (starshipQuery, successCb, failCb) {
            var queryObj = {starship:starshipQuery};
            var query = JSON.stringify(queryObj);
            return AdviceRequestResource.monogolabQuery({q:query}, successCb, failCb);
        };

        return new AdviceRequestResource;
    });