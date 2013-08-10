var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , Config = require('./configLoader')
  , express = require('express')
  , flash = require('connect-flash')
  , mongoose = require('mongoose')
  , mailer = require('./lib/mailer')
  , logger = require('./lib/logger')
  , errorHandler = require('./lib/errorHandler')
  , Validator = require('validator').Validator
  , routes = require('./lib/routes')
  , _ = require('lodash')


var AppLoader = function(){

};

util.inherits(AppLoader, EventEmitter);


AppLoader.prototype.init = function(app){
  this.app = app;

  this.loadConfig();
  mailer.init();

  this.configExceptions();
  this.configValidator();

  this.configApp();
  this.configSession();
  this.configMiddleware();

  var self = this;
  this.on('connectDbDone', function(){
    self.emit('done', self.app);
  });

  this.connectDb();
  
  return this;
}



AppLoader.prototype.loadConfig = function(){
  Config.init();
  this.emit('loadConfigDone', Config.getConfig());
}



AppLoader.prototype.configApp = function(){
  var app = this.app;
  var config = Config.getConfig();

  app.set('views', config.app.env.rootDir + '/views');
  app.set('view engine', 'jade');

  app.use(express.favicon());
  app.use(express.bodyParser());

  this.emit('configAppDone', app);
}



AppLoader.prototype.configSession = function(){
  var app = this.app;

  // session support
  app.use(express.cookieParser());
  
  var sessionConfig = {
    key: '_sess',
    secret: 'dasds21dkds22as2jsjsad%'
  };

  if (this.env === 'production') {
      
  } else {
     app.locals.pretty = true;
  }

  app.use(express.session(sessionConfig));
  app.use(flash());
  
  this.emit('sessionHook', app);
  this.emit('configSessionDone', app);
}





AppLoader.prototype.configMiddleware = function(){
  var app = this.app;
  var config = Config.getConfig();

  var publicFolder = require('path').join(config.app.env.rootDir, 'public');
  app.use(express.static(publicFolder));
  
  this.emit('middlewareHook', app);
    
  app.use(express.methodOverride());

  if (this.env === 'production') {
    app.use(errorHandler({ errView: 'error.jade' }));
  } else {
    app.use(errorHandler({ errView: 'error.jade', showMessage: true, dumpExceptions: true, showStack: true }));
  }

  // Note: static/public files here are free from routing
  app.use(app.router);

  this.emit('configMiddlewareDone', app);
  routes(app);
}




AppLoader.prototype.configValidator = function(){
  Validator.prototype.hasError = function () {
    return !!(this._errors.length);
  }

  Validator.prototype.error = function (msg) {
      if(!_.contains(this._errors, msg)){
        this._errors.push(msg);
      }
      return this;
  }

  Validator.prototype.getErrors = function () {
      return this._errors;
  }

  this.emit('configValidatorDone');
}


AppLoader.prototype.configExceptions = function(){
  process.on('uncaughtException', function (err) {
    console.log(err.stack);
    logger.error('uncaughtException', err.message, err.stack);
    process.exit(1);
  });

  this.emit('configExceptionsDone');
}


AppLoader.prototype.connectDb = function(){
  var self = this;
  var uristring = Config.getConfig().db.dbUri;

  mongoose.connect(uristring, function(err, res) {
    if(err){ 
      logger.error('ERROR connecting to: ' + uristring + '. ' + err);
      self.emit('connectDbDone', err, uristring);
      return;
    }
    self.emit('connectDbDone', null, uristring);
    return logger.info('Connnected to ' + uristring);
  });
}




module.exports = new AppLoader();

