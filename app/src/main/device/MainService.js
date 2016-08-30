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
        var urlAccess = apiUrl + 'accessRight';
        var urlSensor = apiUrl + "sensor";
        return {
            loadAllDevices: function($http, $scope) {
                var getData = function() {

                    return $http.get(url).then(function(result) {
                        var devices = result.data;

                        if (devices) {
                            for (var i = 0; i< devices.length; i++) {
                                var device = devices[i];
                                getMap(device, $scope);
                            }
                        }
                        return devices;
                    });
                };
                return {getData: getData};
            },

            loadAccessRights: function($http) {
                var getData = function() {
                    return $http.get(urlAccess).then(function(result) {
                        var data = result.data;
                        return data;
                    });
                };
                return {getData: getData};
            },

            addNewDevice: function($http, device) {
                var location;
                if (device.location) {
                    location = {
                        lat: device.location.latitude,
                        lon: device.location.longitude
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
                            name: device.accessRights[i].name
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

            addNewSensor: function($http, sensor, device) {

                var metadataArray = [];
                if (sensor.metadata) {
                    for (var i = 0; i< sensor.metadata.length; i++) {
                        var metadata = {
                            name: sensor.metadata[i]
                        };
                        metadataArray.push(metadata);
                    }
                }
                var jsonSensor = JSON.stringify({
                    type: sensor.type,
                    name: sensor.name,
                    metadata: metadataArray,
                    deviceId: device.id
                });
                var getData = function() {
                    console.log(jsonSensor);
                    return $http.post(urlSensor, jsonSensor).then(function(result) {

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

        function getMap(device, $scope) {
            device.map =  {
                show: true,
                control: {},
                version: "unknown",
                showTraffic: true,
                showBicycling: false,
                showWeather: false,
                showHeat: false,
                center: {
                    latitude: device.location.latitude,
                    longitude: device.location.longitude
                },
                options: {
                    streetViewControl: false,
                    panControl: false,
                    maxZoom: 20,
                    minZoom: 3
                },
                zoom: 18,
                dragging: true,
                bounds: {},
                clickedMarker: {
                    id: 0,
                    latitude: device.location.latitude,
                    longitude: device.location.longitude,
                    options: {
                        animation: 1,
                        labelContent: device.name,
                        labelAnchor: "22 0",
                        labelClass: "marker-labels"
                    }
                },
                events: {
                    click: function(mapModel, eventName, originalEventArgs) {

                        var e = originalEventArgs[0];
                        var latitude = e.latLng.lat(),
                            longitude = e.latLng.lng();
                        console.log(latitude);
                        device.location.latitude = latitude;
                        device.location.longitude = longitude;
                        device.map.clickedMarker = {
                            id: 0,
                            options: {
                                labelClass: "marker-labels"
                            },
                            latitude: latitude,
                            longitude: longitude
                        };
                        $scope.$evalAsync();
                    }
                }
            };
        }
    }
})();