
var express = require('express')
  , PushController = require('./controller/push')
  , routes = require('./routes/routes')

var Config = require('../../configLoader')

var PushModule = function() {
}

var config = Config.init().getConfig();


var app = express();
app.set('env', config.env);

PushModule.prototype.init = function(config) {
  var app = express();
  routes.init(app, PushController.init());
  return app;
}



var pm = new PushModule();

/*var port = config.app.env.port;
app.listen(port, function(){
console.log('Express server listening on port ' + port);
});*/

module.exports = pm;