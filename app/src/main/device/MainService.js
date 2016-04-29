(function() {
  'use strict';

  angular
      .module('app')
      .service('mainService', mainService);

  mainService.$inject = ['$q', 'apiUrl'];

  /* @ngInject */
  function mainService($q, apiUrl) {
    // Promise-based API
    var url = apiUrl + "devices";
    return {
      loadAllDevices : function($http) {
        var getData = function() {

          return $http.get(url).then(function(result){
            return result.data;
          });
        };
        return { getData: getData };
      },

      addNewDevice : function($http, device) {
        var jsonDevice = JSON.stringify({ip:device.ip, name:device.name});
        var getData = function() {

          return $http.post(url, jsonDevice).then(function(result){

            return result.data;
          });
        };
        return { getData: getData };
      },

      deleteDevice : function($http, device) {
        var getData = function() {
          return $http.delete(url + '?id=' + device.id).then(function(result){
            return result.data;
          });
        };
        return { getData: getData };
      }
    };
  }
})();