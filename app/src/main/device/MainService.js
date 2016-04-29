(function() {
  'use strict';

  angular
      .module('app')
      .service('mainService', mainService);

  mainService.$inject = ['$q', 'apiUrl'];

  /* @ngInject */
  function mainService($q, apiUrl) {
    // Promise-based API
    return {
      loadAllDevices : function($http) {
        var getData = function() {

          var url = apiUrl + "devices";
          return $http.get(url).then(function(result){
            return result.data;
          });
        };
        return { getData: getData };
      },

      addNewDevice : function($http, device) {
        var jsonDevice = JSON.stringify({ip:device.ip, name:device.name});
        var getData = function() {

          var url = apiUrl + "devices";
          return $http.post(url, jsonDevice).then(function(result){

            return result.data;
          });
        };
        return { getData: getData };
      },

      deleteDevice : function($http, device) {
        var jsonDevice = JSON.stringify({ip:device.ip, name:device.name});
        var getData = function() {

          var url = apiUrl + "devices";
          return $http.delete(url, jsonDevice).then(function(result){

            return result.data;
          });
        };
        return { getData: getData };
      }
    };
  }
})();