var express = require('express')
  , app = express()
  , db = require('./lib/db')
  ,logger = require('./lib/logger')
  , routes = require('./lib/routes');

// Load config
var c = require('./config').init(app, express, function(err, config){

  if(err){
    logger.error(err);
    return;
  }

  // DB Conn
  db(app, function(err){
    if(err){
      // abort!
      logger.error(err);
      return;
    }

    // Config routes and fire up!
    routes(app, config);

    var httpServer = app.listen(config.env.port, function(){
      logger.info('Express server listening on port ' + config.env.port);      
    });

  });
});

// For test-hooks
exports.app = app;