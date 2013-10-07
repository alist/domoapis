
var PushController = require('../controller/push').PushController
  , Config = require('../../../configLoader')
  , UserDevices = require('../model/userdevices').UserDevices

module.exports.public = function(app) {
  app.all('*', function(req, res, next) {
    req.extras = req.extras || {};
    req.extras.isAPI = true;
    next();
  });

  app.get('/index', PushController.index.bind(PushController));
}


module.exports.verif = function(app) {
  app.all('/*', PushController.auth.bind(PushController));
}


module.exports.private = function(app) {
  app.post('/register', PushController.register.bind(PushController));
  app.post('/devicetoken', PushController.devicetoken.bind(PushController));
  app.post('/event', PushController.event.bind(PushController));
}

module.exports.load = function(app) {
  module.exports.public(app);
  module.exports.verif(app);
  module.exports.private(app);
}