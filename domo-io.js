var Config = require('./configLoader')
  , util = require('util')
  , path = require('path')
  , express = require('express')
  , flash = require('connect-flash')
  , mongoose = require('mongoose')
  , async = require('async')
  , errorHandler = require('./lib/errorHandler')
  , auth = require('./auth')
  , mailer = require('./lib/mailer')
  , messenger = require('./lib/messenger')
  , routes = require('./routes/routes')
  , responseExt = require('./lib/responseExt').ResponseExt
  , routeParams = require('./lib/routeParams')
  , partials = require('./lib/partials')
  , Validator = require('validator').Validator
  , _ = require('lodash')



var config = Config.init().getConfig();
var env = config.env;

var app = express();
app.set('env', config.env);


function setupApp(done) {

  // Configure express
  app.configure(function(){

    app.set('apiPath', config.app.api.path);
    app.set('views', config.app.env.rootDir + '/views');
    app.set('view engine', 'jade');

    app.use(express.favicon());
    app.use(express.bodyParser());

    // session support
    app.use(express.cookieParser());

    var sessionConfig = {
      key: '_sess',
      secret: 'd0m0S3cur3S3ss1ons3cr34'
    };

    app.use(express.session(sessionConfig));
    app.use(flash());

    // passport/auth hook
    auth(app);

    var publicFolder = path.join(config.app.env.rootDir, 'public');
    app.use(express.static(publicFolder));

    app.use(express.methodOverride());

    app.disable('x-powered-by');
    responseExt(app);
    routeParams(app);
    partials(app);
    routes(app);

    app.use(app.router);

    if (app.get('env') === 'production') {
      app.use(errorHandler({ errView: 'error.jade' }));
    } else {
      app.locals.pretty = true;
      app.use(errorHandler({ errView: 'error.jade', dumpExceptions: true, showStack: true }));
    }

    done();

  });

}


function setupModules(done) {
  configValidator();
  mailer.init(config.mail);
  messenger.init(config.messenger);

  process.on('uncaughtException', function (err) {
    console.log(err.stack);
    console.log('uncaughtException', err.message);

    if(app.get('env') !== 'production') {
      process.exit(1);
    }
  });

  done();
}


function setupDb(done) {
  // Connect to database
  var dbUri = config.db.dbUri;
  mongoose.connect(dbUri, function(err) {
    if(err) {
      console.log('mongoose.connect', err);
      return done(err);
    }
    console.log('Connnected to ' + dbUri);
    done();
  });
}


function configValidator() {
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
}



// setup everything and run asap
async.parallel([
  setupDb,
  setupApp,
  setupModules
], function(err) {

  var port = config.app.env.port;
  app.listen(port, function(){
      console.log('Express server listening on port ' + port);
  });

});



// For test-hooks
exports.app = app;