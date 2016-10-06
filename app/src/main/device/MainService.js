(function() {
    'use strict';

    angular
        .module('app')
        .service('mainService', mainService);

    mainService.$inject = ['$q', 'apiUrl', 'wsUrl', '$mdDialog'];

    /* @ngInject */
    function mainService($q, apiUrl, wsUrl, $mdDialog) {
        // Promise-based API
        var DEVICE_URL = apiUrl + "device";
        var NEW_DEVICE_URL = apiUrl + "newDeviceId";
        var ACCESS_RIGHTS_URL = apiUrl + 'accessRight';
        var SENSOR_URL = apiUrl + "sensor";
        var stompClient = null;

        var addMapToDevice = function getMap(device, $scope, show) {
            device.map = {
                show: show,
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
                    id: device.id,
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
        };

        function showDialog(text, description) {
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title(text)
                    .textContent(description)
                    .ok('Ok')
            );
        }

        function subscribeToInitDevices(stompClient, $scope, devices) {
            stompClient.subscribe('/topic/initDevices', function(serverResponse) {
                var response = JSON.parse(serverResponse.body).content;
                showDialog(response, 'initMessage');
            });

            stompClient.subscribe('/topic/accSensor', function(serverResponse) {
                var response = JSON.parse(serverResponse.body).content;
                var messageFromDispatcher;
                try {
                    messageFromDispatcher = JSON.parse(response);
                } catch (e){
                    console.log("Cannot parse dispatcher JSON: " + response);
                    return;
                }
                var dispatcherId = messageFromDispatcher.deviceId;
                var deviceIndex = -1;
                for (var i = 0; i < devices.length; i++) {
                    var device = devices[i];
                    var deviceId = device.id;
                    if(deviceId == dispatcherId){
                        deviceIndex = i;
                    }
                }
                if(deviceIndex != -1) {
                    addInfo(messageFromDispatcher.message, $scope, devices[deviceIndex]);
                }
            });
        }

        function addInfo(response, $scope, device) {
            var d = {
                content: 'No data received!'
            };
            var c = {
                content: response
            };
            if (device.messages.length > 2) {
                device.messages.splice(0, 1);
            }

            if (!response) {
                device.messages.push(d);
            } else {
                device.messages.push(c);
            }
            $scope.$apply();

        }

        return {
            loadAllDevices: function($http, $scope) {
                var getData = function() {

                    return $http.get(DEVICE_URL).then(function(result) {
                        var devices = result.data;

                        if (devices) {
                            for (var i = 0; i < devices.length; i++) {
                                var device = devices[i];
                                device.messages = [];
                                addMapToDevice(device, $scope, false);
                            }
                        }
                        return devices;
                    });
                };
                return {getData: getData};
            },

            generateNewDeviceId: function($http, type) {
                var getData = function() {
                    var typePrefix = '';
                    if (type) {
                        typePrefix = '?type=' + type;
                    }

                    return $http.get(NEW_DEVICE_URL + typePrefix).then(function(result) {
                        var newDeviceId = result.data.content;
                        return newDeviceId;
                    });
                };
                return {getData: getData};
            },

            loadAccessRights: function($http) {
                var getData = function() {
                    return $http.get(ACCESS_RIGHTS_URL).then(function(result) {
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
                        latitude: device.location.latitude,
                        longitude: device.location.longitude
                    };
                }

                var tags = [];
                if (device.tags) {
                    for (var i = 0; i < device.tags.length; i++) {
                        var tag = {
                            name: device.tags[i]
                        };
                        tags.push(tag);
                    }
                }

                var accessRights = [];
                if (device.accessRights) {
                    for (i = 0; i < device.accessRights.length; i++) {
                        var accessRight = {
                            name: device.accessRights[i].name
                        };
                        accessRights.push(accessRight);
                    }
                }

                var jsonDevice = JSON.stringify({
                    id: device.id,
                    type: device.type,
                    name: device.name,
                    location: location,
                    tags: tags,
                    accessRights: accessRights
                });
                var getData = function() {
                    console.log(jsonDevice);

                    return $http.post(DEVICE_URL, jsonDevice).then(function(result) {

                        return result.data;
                    });
                };
                return {getData: getData};
            },

            addNewSensor: function($http, sensor, device) {

                var metadataArray = [];
                if (sensor.metadata) {
                    for (var i = 0; i < sensor.metadata.length; i++) {
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
                    return $http.post(SENSOR_URL, jsonSensor).then(function(result) {

                        return result.data;
                    });
                };
                return {getData: getData};
            },

            deleteDevice: function($http, device) {
                var getData = function() {
                    return $http.delete(DEVICE_URL + '?id=' + device.id).then(function(result) {
                        return result.data;
                    });
                };
                return {getData: getData};
            },
            addMapToDevice: addMapToDevice,
            showDialog: showDialog,

            connectToRealDevice: function connectToRealDevice(device) {
                stompClient.send("/iot/init", {}, JSON.stringify({
                    'deviceName': device.name,
                    'deviceIp': device.ip,
                    'deviceId': device.id,
                    'disconnect': false
                }));
            },
            disconnectFromRealDevice: function disconnectFromRealDevice(device) {
                stompClient.send("/iot/init", {}, JSON.stringify({
                    'deviceName': device.name,
                    'deviceIp': device.ip,
                    'deviceId': device.id,
                    'disconnect': true
                }));
            },
            disconnectToDevicesDispatcher: function disconnectToDevicesDispatcher() {
                if (stompClient != null) {
                    stompClient.disconnect();
                    console.log("Disconnected");
                    showDialog("Disconnected!");
                } else {
                    showDialog("No need for disconnecting!");
                }
            },
            connectToDevicesDispatcher: function connectToDevicesDispatcher($scope, devices) {

                var target = '/iot-dispatcher-websocket';
                var socket = new SockJS(wsUrl + target);
                stompClient = Stomp.over(socket);
                stompClient.connect({}, function(frame) {
                    subscribeToInitDevices(stompClient, $scope, devices);
                    console.log('Connected: ' + frame);
                    if (!stompClient) {
                        alert('dsfd');
                    }
                    showDialog("Successfully connected to devices dispatcher!");
                });
            }
        };


    }
})();