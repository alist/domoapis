
var apn = require('apn')

// TODO: reconnect on disconnection, error handling and propagation
var IOSPushService = function() {

};


IOSPushService.prototype.init = function(config) {
  this.config = config;

  this.setupApnConnection();
  this.setupApnFeedback();

  return this;
}


IOSPushService.prototype.setupApnFeedback = function() {

  var opts = this.config.feedbackOptions;
  var feedback = new apn.Feedback({
    address: opts.address,
    batchFeedback: opts.batchFeedback,
    interval: opts.interval,
    pfx: this.config.cert
  });

  // need to publish events to redis so any interested service can consume
  feedback.on('error', console.error);
  feedback.on('feedbackError', console.error);
  feedback.on('feedback', function(devices) {
    console.log('devices.length', devices.length);
      devices.forEach(function(item) {
        console.log(item);
      });
  });

}


IOSPushService.prototype.setupApnConnection = function() {

  var service = this.apnConnection = new apn.connection({
    gateway: this.config.gateway,
    pfx: this.config.cert
  });

  // need to publish events to redis so any interested service can consume
  service.on('error', function(err) {
    console.log("APN: Error: " + err);
  });

  service.on('connected', function() {
    console.log("APN: Connected");
  });

  service.on('transmitted', function(notification, device) {
    console.log("APN: Notification transmitted to:" + device.token.toString('hex'));
  });

  service.on('transmissionError', function(errCode, notification, device) {
    console.error("APN: Notification caused error: " + errCode + " for device ", device, notification);
  });

  service.on('timeout', function() {
    console.log("APN: Connection Timeout");
  });

  service.on('disconnected', function() {
    console.log("APN: Disconnected from APNS");
  });

  service.on('socketError', console.error);
}


IOSPushService.prototype.sendMessage = function(devicetoken, payload, alert, opts) {

  try {
    var device = new apn.Device(devicetoken);
    var note = new apn.Notification();
    note.alert = alert;
    note.payload = payload;

    console.log("options: " +opts);
    for(var k in opts) {
      note[k] = opts[k];
    }

    this.apnConnection.pushNotification(note, device);
  } catch(e) {
    return e;
  }

  return true;
}


module.exports = new IOSPushService();
