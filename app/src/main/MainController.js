(function() {

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

        // Load all registered devices
        function loadAllDevices() {
            mainService
                .loadAllDevices($http).getData()
                .then(function(devices) {
                    console.log(devices);
                    vm.devices = [].concat(devices);
                });
        }

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
                    ip: 'localhost',
                    name: 'Phone',
                    tags: []
                };
                $scope.hide = function() {
                    $mdDialog.hide();
                };
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                $scope.answer = function() {
                    $mdDialog.hide();
                    mainService
                        .addNewDevice($http, this.device).getData()
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
                                    .ariaLabel('Alert Dialog Demo')
                                    .ok('OK')
                            );

                        });
                };
            }

        }
    }
})();
