var kue = require('kue')
  , redis = require('redis')


var Mailer = function(){

};


Mailer.prototype.init = function(config) {

  if(typeof config.mail !== 'object') {
    throw new Error('Required: Mail config');
  }
  this.mailConfig = config.mail;

  if(typeof config.redis !== 'object') {
    throw new Error('Required: Redis config');
  }

  kue.redis.createClient = function() {
    return redis.createClient(config.redis.port, config.redis.host);
  };

  this.jobs = kue.createQueue();
}


Mailer.prototype.sendMessage = function(message, callback) {

  var job = this.jobs.create('email', message);

  job.on('complete', function(){
    console.log("Job complete");
    callback();
  }).on('failed', function(){
    callback(new Error('E-mail failed'));
  }).attempts(this.mailConfig.retry).save();
}


var m = new Mailer();
module.exports = m;