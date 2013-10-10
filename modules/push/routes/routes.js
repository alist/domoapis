
var PushRoutes = function() {
}


PushRoutes.prototype.init = function(app, PushController) {
  this.app = app;
  this.PushController = PushController;

  this.public(app, PushController);
  this.verif(app, PushController);
  this.private(app, PushController);
  return this;
}


PushRoutes.prototype.public = function() {
  var app = this.app;
  var PushController = this.PushController;

  app.all('*', function(req, res, next) {
    req.extras = req.extras || {};
    req.extras.isAPI = true;
    next();
  });

  app.get('/index', PushController.index.bind(PushController));
  app.post('/event', PushController.event.bind(PushController));
  app.post('/register', PushController.register.bind(PushController));
  app.post('/devicetoken', PushController.devicetoken.bind(PushController));
}


PushRoutes.prototype.verif = function() {
  var app = this.app;
  var PushController = this.PushController;

  app.all('/*', PushController.auth.bind(PushController));
}


PushRoutes.prototype.private = function() {
}


module.exports = new PushRoutes();
