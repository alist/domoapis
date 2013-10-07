
var UserController = require('../../../controller/user').UserController


var PushController = function() {
}

PushController.prototype.auth = UserController.validateToken.bind(UserController);

PushController.prototype.index = function(req, res, next) {
  res.ext.data({ data: 'push index' }).render();
}

PushController.prototype.register = function(req, res, next) {
  res.ext.data({ data: 'push register' }).render();
}


PushController.prototype.devicetoken = function(req, res, next) {
  res.ext.data({ data: 'push devicetoken' }).render();
}


PushController.prototype.event = function(req, res, next) {
  res.ext.data({ data: 'push event' }).render();
}


module.exports.PushController = new PushController();