(function() {
    'use strict';

    angular
        .module('app')
        .service('mainService', mainService);

    mainService.$inject = ['$q', 'apiUrl'];

    /* @ngInject */
    function mainService($q, apiUrl) {
        // Promise-based API
        var url = apiUrl + "device";
        return {
            loadAllDevices: function($http) {
                var getData = function() {

                    return $http.get(url).then(function(result) {
                        return result.data;
                    });
                };
                return {getData: getData};
            },

            addNewDevice: function($http, device) {
                var location;
                if (device.location) {
                    location = {
                        x: device.location.x,
                        y: device.location.y
                    };
                }

                var tags = [];
                if (device.tags) {
                    for (var i = 0; i< device.tags.length; i++) {
                        var tag = {
                            name: device.tags[i]
                        };
                        tags.push(tag);
                    }
                }

                var accessRights = [];
                if (device.accessRights) {
                    for (i = 0; i< device.accessRights.length; i++) {
                        var accessRight = {
                            name: device.accessRights[i]
                        };
                        accessRights.push(accessRight);
                    }
                }

                var jsonDevice = JSON.stringify({
                    ip: device.ip,
                    type: device.type,
                    name: device.name,
                    location: location,
                    tags: tags,
                    accessRights: accessRights
                });
                var getData = function() {
                    console.log(jsonDevice);

                    return $http.post(url, jsonDevice).then(function(result) {

                        return result.data;
                    });
                };
                return {getData: getData};
            },

            deleteDevice: function($http, device) {
                var getData = function() {
                    return $http.delete(url + '?id=' + device.id).then(function(result) {
                        return result.data;
                    });
                };
                return {getData: getData};
            }
        };
    }
})();