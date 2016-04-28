(function () {

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

    MainController.$inject = ['mainService', '$mdSidenav', '$mdBottomSheet', '$log', '$q', '$http', '$scope', '$mdDialog', '$mdMedia'];

    function MainController(mainService, $mdSidenav, $mdBottomSheet, $log, $q, $http, $scope, $mdDialog, $mdMedia) {

        var vm = this;
        $scope.errors = {};
        var myScopeErrors = $scope.errors;
        var mainDialog = $mdDialog;


        vm.devices = [];
        vm.currDevice = '';
        vm.toggleList = toggleDevicesList;
        vm.showContactOptions = showContactOptions;
        vm.showAddNewDevicePrompt = showAddNewDevicePrompt;

        // Load all registered devices
        mainService
            .loadAllDevices($http).getData()
            .then(function (devices) {
                vm.devices = [].concat(devices);
            });

        // *********************************
        // Internal methods
        // *********************************

        /**
         * First hide the bottomsheet IF visible, then
         * hide or Show the 'left' sideNav area
         */
        function toggleDevicesList() {
            var pending = $mdBottomSheet.hide() || $q.when(true);

            pending.then(function () {
                $mdSidenav('left').toggle();
            });
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
            }).then(function (clickedItem) {
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
                this.submitContact = function (action) {
                    $mdBottomSheet.hide(action);
                };
            }
        }

        function showAddNewDevicePrompt($event) {
            $scope.status = '  ';
            $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');

            return $mdDialog.show({

                controller: DialogController,
                controlerAs: "dc",
                templateUrl: './src/main/view/addNewDeviceDialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true,
                fullscreen: true

            }).then(function () {
                $scope.status = 'OK';
                $log.debug('OK');
            }, function () {
                var dialogCanceled = 'You cancelled the dialog.';
                $scope.status = dialogCanceled;
                $log.debug(dialogCanceled);
            });

            function DialogController($scope, $mdDialog, $compile, $templateRequest) {

                $scope.device = {
                    ip: 'localhost',
                    name: 'Phone'
                };


                $scope.hide = function () {
                    $mdDialog.hide();
                };
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.answer = function () {
                    $mdDialog.hide();
                    var template = "";
                    $templateRequest("./src/main/view/deviceCardContent.tmpl.html", false).then(function(html){
                        // Convert the html to an actual DOM node
                        template = '<md-card md-theme-watch>' +  html  + '</md-card>';
                        //angular.element.append(template);
                        //$compile(template)($scope);
                    });
                    mainService
                        .addNewDevice($http, this.device).getData()
                        .then(function (data) {
                            $log.debug("Success!" + data.ip + " " + data.name);
                            //var template = + $templateCache.get('./src/main/view/deviceCardContent.tmpl.html');

                            $scope.device = data;
                            angular.element(document.getElementById('md-cards-devices-content-id')).append($compile(template)($scope));
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
