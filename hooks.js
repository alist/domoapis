var errorHandler = require('./lib/errorHandler')
  , mailer = require('./lib/mailer')
  , routes = require('./lib/routes')
  , responseExt = require('./lib/responseExt').ResponseExt
  , routeParams = require('./lib/routeParams')
  , partials = require('./lib/partials')
  , authHooks = require('./auth')
  , Validator = require('validator').Validator
  , _ = require('lodash')


module.exports.registerHooks = function(appLoader) {

  authHooks(appLoader);

  appLoader.once('postConfigHook', function(app) {
    console.log('ENV:', appLoader.config.env);
    mailer.init(appLoader.config.mail);
    configValidator();
  });

  appLoader.once('routerHook', function(app) {
    app.disable('x-powered-by');
    responseExt(app);
    routeParams(app);
    partials(app);
    routes(app);
  });

  appLoader.once('postRouterHook', function(app) {
    if (appLoader.env === 'production') {
      app.use(errorHandler({ errView: 'error.jade' }));
    } else {
      app.locals.pretty = true;
      app.use(errorHandler({ errView: 'error.jade', dumpExceptions: true, showStack: true }));
    }
  });

  appLoader.once('dbConnectHook', function(app, dbUri) {
    console.log('Connnected to ' + dbUri);
  });

  appLoader.once('dbErrorHook', function(err, app, dbUri) {
    console.log('ERROR connecting to: ' + dbUri + ' | ' + err);
  });


  appLoader.on('exceptionHook', function(err) {
    console.log(err.stack);
    console.log('uncaughtException', err.message);

    if(appLoader.env !== 'production') {
      process.exit(1);
    }
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
