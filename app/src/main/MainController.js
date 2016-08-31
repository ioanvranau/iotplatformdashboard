(function() {
    'use strict';

    angular
        .module('app')
        .controller('MainController', MainController);

    /**
     * Main Controller for the Angular Material Starter App
     * @param $scope
     * @param $mdSidenav
     * @param avatarsService
     * @constructor
     */

    MainController.$inject = ['mainService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$http', '$scope', '$mdDialog', '$mdMedia', '$timeout'];

    function MainController(mainService, $mdSidenav, $mdBottomSheet, $log, $q, $http, $scope, $mdDialog, $mdMedia, $timeout) {

        var vm = this;
        $scope.errors = {};
        var myScopeErrors = $scope.errors;
        var mainDialog = $mdDialog;

        vm.devices = [];
        vm.currDevice = '';
        vm.toggleDevicesList = buildDelayedToggler('left');
        vm.showContactOptions = showContactOptions;
        vm.showAddNewDevicePrompt = showAddNewDevicePrompt;
        vm.deleteDevice = deleteDevice;
        vm.showNewSensorDialog = showNewSensorDialog;

        // Load all registered devices
        function loadAllDevices() {
            mainService
                .loadAllDevices($http, $scope).getData()
                .then(function(devices) {
                    vm.devices = [].concat(devices);
                });
        }
        $scope.options = {scrollwheel: false};
        $scope.coordsUpdates = 0;
        $scope.dynamicMoveCtr = 0;
        $scope.$watchCollection("marker.coords", function (newVal, oldVal) {
            if (_.isEqual(newVal, oldVal))
                return;
            $scope.coordsUpdates++;
        });
        loadMqtt();
        loadAllDevices();

        // *********************************
        // Internal methods
        // *********************************

        /**
         * Build handler to open/close a SideNav; when animation finishes
         * report completion in console
         */
        function buildDelayedToggler(navID) {
            return debounce(function() {
                $mdSidenav(navID)
                    .toggle()
                    .then(function() {
                        $log.debug("toggle " + navID + " is done");
                    });
            }, 200);
        }

        function loadMqtt() {
            //Using the HiveMQ public Broker, with a random client Id
            vm.client = new Messaging.Client("broker.mqttdashboard.com", 8000, "myclientid_" + parseInt(Math.random() * 100, 10));

            //Gets  called if the websocket/mqtt connection gets disconnected for any reason
            vm.client.onConnectionLost = function (responseObject) {
                //Depending on your scenario you could implement a reconnect logic here
                alert("connection lost: " + responseObject.errorMessage);
            };

            //Gets called whenever you receive a message for your subscriptions
            vm.client.onMessageArrived = function (message) {
                //Do something with the push message you received
                console.log('Topic: ' + message.destinationName + '  | ' + message.payloadString );
            };

            //Connect Options
            vm.options = {
                timeout: 3,
                //Gets Called if the connection has sucessfully been established
                onSuccess: function () {
                    alert("Connected");
                },
                //Gets Called if the connection could not be established
                onFailure: function (message) {
                    alert("Connection failed: " + message.errorMessage);
                }
            };

            //Creates a new Messaging.Message Object and sends it to the HiveMQ MQTT Broker
            vm.publish = function (payload, topic, qos) {
                //Send your message (also possible to serialize it as JSON or protobuf or just use a string, no limitations)
                var message = new Messaging.Message(payload);
                message.destinationName = topic;
                message.qos = qos;
                vm.client.send(message);
            }
        }

        function debounce(func, wait, context) {
            var timer;
            return function debounced() {
                var context = $scope,
                    args = Array.prototype.slice.call(arguments);
                $timeout.cancel(timer);
                timer = $timeout(function() {
                    timer = undefined;
                    func.apply(context, args);
                }, wait || 10);
            };
        }

        /**
         * Show the bottom sheet
         */
        function showContactOptions($event, device) {

            return $mdBottomSheet.show({
                parent: angular.element(document.getElementById('content')),
                templateUrl: './src/main/view/contactSheet.html',
                controller: ['$mdBottomSheet', ContactPanelController],
                controllerAs: "cp",
                bindToController: true,
                targetEvent: $event
            }).then(function(clickedItem) {
                clickedItem && $log.debug(clickedItem.name + ' clicked!');
            });

            /**
             * Bottom Sheet controller for the Avatar Actions
             */
            function ContactPanelController($mdBottomSheet) {
                this.device = device;
                this.actions = [
                    {name: 'Phone', icon: 'phone', icon_url: 'assets/svg/phone.svg'},
                    {name: 'Twitter', icon: 'twitter', icon_url: 'assets/svg/twitter.svg'},
                    {name: 'Google+', icon: 'google_plus', icon_url: 'assets/svg/google_plus.svg'},
                    {name: 'Hangout', icon: 'hangouts', icon_url: 'assets/svg/hangouts.svg'}
                ];
                this.submitContact = function(action) {
                    $mdBottomSheet.hide(action);
                };
            }
        }

        function showNewSensorDialog($event, device) {

            $scope.status = '  ';
            $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');

            return $mdDialog.show({
                controller: SensorDialogController,
                controllerAs: "sdc",
                templateUrl: './src/main/view/addNewDeviceSensorDialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: $event,
                clickOutsideToClose: true,
                fullscreen: true

            }).then(function() {
                $scope.status = 'OK';
                $log.debug('OK');
            }, function() {
                var dialogCanceled = 'You cancelled the dialog.';
                $scope.status = dialogCanceled;
                $log.debug(dialogCanceled);
            });

            function SensorDialogController($scope, $mdDialog) {

                console.log(device);
                $scope.sensor = {
                    name: 'Phone',
                    type: 'acc',
                    metadata: []
                };
                $scope.device = device;

                $scope.hide = function() {
                    $mdDialog.hide();
                };
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                $scope.answer = function() {
                    $mdDialog.hide();
                    mainService
                        .addNewSensor($http, $scope.sensor, $scope.device).getData()
                        .then(function(data) {
                            $log.debug("Success!" + data.name);
                            loadAllDevices();
                            myScopeErrors.api = false;
                        }, function(err) {
                            // Here is where we can catch the errors and start using the response.
                            myScopeErrors.api = err.data.exception;
                            mainDialog.show(
                                mainDialog.alert()
                                    .parent(angular.element(document.querySelector('#popupContainer')))
                                    .clickOutsideToClose(true)
                                    .title('Sensor ' + err.data.message + ' cannot be added. Please check again the input provided!')
                                    .textContent(err.data.exception)
                                    .ariaLabel('Alert')
                                    .ok('OK')
                            );

                        });
                };
            }
        }

        function deleteDevice($event, device) {

            var confirm = $mdDialog.confirm()
                .title('Would you like to delete the device: ' + device.name + ' with ip: ' + device.ip + ' ?')
                .clickOutsideToClose(true)
                .ariaLabel('Delete device')
                .targetEvent($event)
                .ok('Yes')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                mainService
                    .deleteDevice($http, device).getData()
                    .then(function() {
                        var myEl = angular.element(document.getElementById(device.id));
                        myEl.remove();
                        $log.debug('Device: ' + device.name + ' was deleted!');
                    });
            }, function() {
                $log.debug('Operation canceled!');
            }, function(err) {
                // Here is where we can catch the errors and start using the response.
                myScopeErrors.api = err.data.exception;
                mainDialog.show(
                    mainDialog.alert()
                        .parent(angular.element(document.querySelector('#popupContainer')))
                        .clickOutsideToClose(true)
                        .title('Device ' + err.data.message + ' cannot be deleted!')
                        .textContent(err.data.exception)
                        .ariaLabel('Alert Dialog ')
                        .ok('OK')
                );

            });
        }

        function showAddNewDevicePrompt($event) {
            $scope.status = '  ';
            $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');

            return $mdDialog.show({

                controller: DialogController,
                controlerAs: "dc",
                templateUrl: './src/main/view/addNewDeviceDialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: $event,
                clickOutsideToClose: true,
                fullscreen: true

            }).then(function() {
                $scope.status = 'OK';
                $log.debug('OK');
            }, function() {
                var dialogCanceled = 'You cancelled the dialog.';
                $scope.status = dialogCanceled;
                $log.debug(dialogCanceled);
            });

            function DialogController($scope, $mdDialog) {
                $scope.device = {
                    ip: '',
                    name: 'Device',
                    id: 1,
                    tags: [],
                    location: {
                        latitude: 46.77224125123537,
                        longitude: 23.5853773355484
                    },
                    accessRights: []
                };
                mainService.addMapToDevice($scope.device, $scope, false);
                $scope.selectedItem = null;
                $scope.searchText = null;
                loadAllAccessRights();

                $scope.selectedAccessRights = [];
                $scope.numberChips = [];
                $scope.numberChips2 = [];
                $scope.numberBuffer = '';

                $scope.querySearch = function querySearch(query) {
                    return query ? $scope.accessRights.filter(createFilterFor(query)) : [];
                };

                function createFilterFor(query) {
                    var lowercaseQuery = angular.lowercase(query);

                    return function filterFn(accessRight) {
                        return (accessRight.name.indexOf(lowercaseQuery) === 0);
                    };
                }

                // Load all registered devices
                function loadAllAccessRights() {
                    mainService
                        .loadAccessRights($http).getData()
                        .then(function(accessRights) {
                            $scope.accessRights = [].concat(accessRights);
                        });
                }


                $scope.hide = function() {
                    $mdDialog.hide();
                };
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                $scope.answer = function() {
                    $mdDialog.hide();
                    mainService
                        .addNewDevice($http, $scope.device).getData()
                        .then(function(data) {
                            $log.debug("Success!" + data.ip + " " + data.name);
                            loadAllDevices();
                            myScopeErrors.api = false;
                        }, function(err) {
                            // Here is where we can catch the errors and start using the response.
                            myScopeErrors.api = err.data.exception;
                            mainDialog.show(
                                mainDialog.alert()
                                    .parent(angular.element(document.querySelector('#popupContainer')))
                                    .clickOutsideToClose(true)
                                    .title('Device ' + err.data.message + ' cannot be added. Please check again the provided ip!')
                                    .textContent(err.data.exception)
                                    .ariaLabel('Alert')
                                    .ok('OK')
                            );

                        });
                };
            }

        }
    }
})();
