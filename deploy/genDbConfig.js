var fs = require('fs')
  , config = require('../config')
  , configLoader = require('../configLoader');

var dbConfig = {};

config.envList.forEach(function(env){
  if(env === config.defaultsKey)    return;
  dbConfig[env] = configLoader.forceEnv(env, true).init().getConfig().db;
});

fs.writeFileSync('./dbConfig.js', 'var dbConfig = ' + JSON.stringify(dbConfig) + ';');
