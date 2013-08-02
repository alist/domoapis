var express = require('express')
  , app = express()
  , logger = require('./lib/logger')
  , AppLoader = require('./appLoader')
  , Config = require('./configLoader')
  , AuthHooks = require('./auth')



function listen(){
  var config = Config.getConfig();
  app.listen(config.app.env.port, function(){
      logger.info('Express server listening on port ' + config.app.env.port);
  });
}


AuthHooks(AppLoader);

AppLoader.on('done', function(app){
  listen();
});

AppLoader.init(app);


// For test-hooks
exports.app = app;