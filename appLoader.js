var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , Config = require('./configLoader')
  , express = require('express')
  , flash = require('connect-flash')
  , mongoose = require('mongoose')
  , async = require('async')


var AppLoader = function(){

};

util.inherits(AppLoader, EventEmitter);


AppLoader.prototype.init = function(app){
  this.app = app;
  var self = this;

  this.emit('preConfigHook', app);
  this.loadConfig();
  this.configExceptions(function(err) {
    self.emit('exceptionHook', err, app);
  });
  this.emit('postConfigHook', app);

  async.parallel([
    // Configure Express
    function(done) {
      self.emit('preAppHook', app);
      self.configApp();
      self.emit('postAppHook', app);

      self.emit('preSessionHook', app);
      self.configSession(function(sessionConfig) {
        self.emit('sessionHook', app, sessionConfig);
      });
      self.emit('postSessionHook', app);

      self.emit('preStaticHook', app);
      self.configStatic();
      self.emit('postStaticHook', app);

      self.emit('preRouterHook', app);
      self.configRouter(function() {
        self.emit('routerHook', app);
      });
      self.emit('postRouterHook', app);

      done();
    },
    // Connect Db
    function(done) {
      self.emit('preDbHook', app);
      self.connectDb(function(err, dbUri) {
        if(err) {
          self.emit('dbErrorHook', err, app, dbUri);
        }
        self.emit('dbConnectHook', app, dbUri);
        self.emit('postDbHook', app);
        done(err);
      });
    }
  ], function(err, results) {
    if(err) {
      return self.emit('error', err, app);
    }
    return self.emit('done', app);
  });
  
  return this;
}



AppLoader.prototype.loadConfig = function(){
  Config.init();
  this.config = Config.getConfig();
  this.env = this.config.env;
}



AppLoader.prototype.configApp = function(){
  var app = this.app;

  app.set('views', this.config.app.env.rootDir + '/views');
  app.set('view engine', 'jade');

  app.use(express.favicon());
  app.use(express.bodyParser());
}



AppLoader.prototype.configSession = function(fnSessionHook){
  var app = this.app;

  // session support
  app.use(express.cookieParser());
  
  var sessionConfig = {
    key: '_sess',
    secret: 'dasds21dkds22as2jsjsad%'
  };

  if(typeof fnSessionHook === 'function') {
    fnSessionHook(sessionConfig);
  }

  app.use(express.session(sessionConfig));
  app.use(flash());
}


AppLoader.prototype.configStatic = function(){
  var app = this.app;

  // Note: static/public files here are free from routing
  var publicFolder = require('path').join(this.config.app.env.rootDir, 'public');
  app.use(express.static(publicFolder));
}


AppLoader.prototype.configRouter = function(fnRouterHook){
  var app = this.app;

  app.use(express.methodOverride());

  if(typeof fnRouterHook === 'function') {
    fnRouterHook();
  }
  app.use(app.router);
}


AppLoader.prototype.configExceptions = function(fnException){
  process.on('uncaughtException', function (err) {
    if(typeof fnException === 'function') {
      fnException(err);
    }
  });
}


AppLoader.prototype.connectDb = function(done){
  var dbUri = this.config.db.dbUri;

  mongoose.connect(dbUri, function(err, res) {
    return done(err, dbUri);
  });
}




module.exports = new AppLoader();
