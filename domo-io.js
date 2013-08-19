var express = require('express')
  , app = express()
  , appLoader = require('./appLoader')
  , hooks = require('./hooks')


hooks.registerHooks(appLoader);

appLoader.on('done', function(app){
  var port = appLoader.config.app.env.port;

  app.listen(port, function(){
      console.log('Express server listening on port ' + port);
  });
});


appLoader.on('error', function(err, app){
  console.log('ERROR:', err);
});


appLoader.init(app);


// For test-hooks
exports.app = app;