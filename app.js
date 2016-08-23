var express = require('express');
var app = express();
app.use(express.static(__dirname + '/app'));
app.config(function ($httpProvider) {
  $httpProvider.defaults.headers.common = {};
  $httpProvider.defaults.headers.post = {};
  $httpProvider.defaults.headers.put = {};
  $httpProvider.defaults.headers.patch = {};
});
app.listen(process.env.PORT || 3000);