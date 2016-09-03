(function() {
    'use strict';

    angular
        .module('app')
        .constant('apiUrl', "https://iotplatformbackend.herokuapp.com/")
        .constant('wsUrl', "https://iotplatformdispatcher.herokuapp.com/");
    //.constant('apiUrl', "http://127.0.0.1:9090/");
    //.constant('wsUrl', "http://127.0.0.1:9092/");
})();
