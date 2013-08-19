var exec = require('child_process').exec
  , fs = require('fs')
  , path = require('path')
  , config = require('../config')
  , configLoader = require('../configLoader')


var confFilename = 'dbConfig.js';
var dbConfig = {};

config.envList.forEach(function(env) {
  if(env === config.defaultsKey)    return;
  dbConfig[env] = configLoader.forceEnv(env, true).init().getConfig().db;
});

fs.writeFileSync(path.join(__dirname, confFilename), 'var dbConfig = ' + JSON.stringify(dbConfig) + ';');

var confFilePath = path.join(__dirname, confFilename);
console.log('confFilePath', confFilePath);

var cmd = 'mongo --port 18001 --host 127.0.0.1 "' + confFilePath + '"';
console.log('cmd', cmd);

var child = exec(cmd, function (error, stdout, stderr) {
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
})