
var express = require('express')
  , routes = require('./routes/routes')
  , apn = require('apn')


var PushManager = function() {

};

PushManager.prototype.init = function(config) {
  this.config = config;

  this.setupApnConnection();
  this.setupApnFeedback();

  var app = express();

  routes.load(app, config);
  return app;
}


PushManager.prototype.setupApnFeedback = function() {

  var feedback = new apn.Feedback(this.config.push.feedbackOptions);
  feedback.on('feedbackError', console.error);
  feedback.on('feedback', function(devices) {
    console.log('devices.length', devices.length);
      devices.forEach(function(item) {
          console.log(item);
      });
  });

}


PushManager.prototype.setupApnConnection = function() {

  var service = this.apnConnection = new apn.connection({ gateway: this.config.push.gateway });

  service.on('connected', function() {
      console.log("Connected");
  });

  service.on('transmitted', function(notification, device) {
      console.log("Notification transmitted to:" + device.token.toString('hex'));
  });

  service.on('transmissionError', function(errCode, notification, device) {
      console.error("Notification caused error: " + errCode + " for device ", device, notification);
  });

  service.on('timeout', function () {
      console.log("Connection Timeout");
  });

  service.on('disconnected', function() {
      console.log("Disconnected from APNS");
  });

  service.on('socketError', console.error);
}


PushManager.prototype.sendMessage = function(user, message, callback) {
  var device = new apn.Device("ID0NTHAV3AD3V1C3T0K3N");
  var note = new apn.Notification();

  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.badge = 1;
  note.sound = "ping.aiff";
  note.alert = "New message";
  note.payload = { 'messageFrom': 'User' };

  this.apnConnection.pushNotification(note, device);
}


var pm = new PushManager();
module.exports = pm;