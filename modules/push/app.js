
var express = require('express')
  , PushController = require('./controller/push')
  , routes = require('./routes/routes')


var PushModule = function() {
}


PushModule.prototype.init = function(config) {
  var app = express();
  routes.init(app, PushController.init());
  return app;
}



var pm = new PushModule();
module.exports = pm;