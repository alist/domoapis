
var gcm = require('node-gcm')


var AndroidPushService = function() {

};


AndroidPushService.prototype.init = function(config) {
  this.config = config;
  this.gcmService = new gcm.Sender(config.key);

  return this;
}


AndroidPushService.prototype.sendMessage = function(devicetoken, payload, alert, opts) {
  var message = new gcm.Message({
    collapseKey: alert,
    delayWhileIdle: opts.delayWhileIdle || true,
    timeToLive: opts.timeToLive || 3,
    data: payload
  });

  this.gcmService.send(message, [ devicetoken ], (opts.retries || 3), function (err, result) {
    console.log("devicetoken: " + devicetoken, err + " | " + JSON.stringify(result));
  });

  return true;
}


module.exports = new AndroidPushService();
