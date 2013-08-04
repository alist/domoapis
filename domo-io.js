var express = require('express')
  , app = express()
  , logger = require('./lib/logger')
  , AppLoader = require('./appLoader')
  , Config = require('./configLoader')
  , ResponseExt = require('./lib/responseExt')
  , AuthHooks = require('./auth')


function registerHooks(){
  ResponseExt(AppLoader);
  AuthHooks(AppLoader);
}


function listen(){
  var config = Config.getConfig();
  app.listen(config.app.env.port, function(){
      logger.info('Express server listening on port ' + config.app.env.port);
  });
}


registerHooks();

AppLoader.on('done', function(app){
  listen();
});

AppLoader.init(app);


// For test-hooks
exports.app = app;