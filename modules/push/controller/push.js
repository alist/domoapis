
var UserController = require('../../../controller/user').UserController
  , IOSPushService = require('../lib/iosPushService')
  , UserDevice = require('../model/userdevices').UserDevice
  , Config = require('../../../configLoader')
  , _ = require('lodash')


var PushController = function() {
}

PushController.prototype.init = function() {
  var config = Config.getConfig();
  this.iosPushService = IOSPushService.init(config.push);
  return this;
}


PushController.prototype.auth = UserController.validateToken.bind(UserController);


PushController.prototype.index = function(req, res, next) {
  res.ext.data({ data: 'push index' }).render();
}


PushController.prototype.register = function(req, res, next) {

  var newDeviceAttrs = _.pick(req.body, [ 'deviceType', 'deviceToken', 'deviceMeta' ]);
  newDeviceAttrs.subscriberId = (!!req.user && !!req.user._id) ? req.user._id : null;

  UserDevice.register(newDeviceAttrs, function(err, newDevice) {
    if(err) {
      return res.ext.error(err).render();
    }

    res.ext
      .data(_.findWhere(newDevice.toObject().devices, { deviceToken: newDeviceAttrs.deviceToken }))
      .data({ subscriberId: newDevice.subscriberId })
      .render();
  });

}


PushController.prototype.devicetoken = function(req, res, next) {

  var updateDeviceAttrs = _.pick(req.body, [ 'subscriberId', 'deviceId', 'deviceToken' ]);

  UserDevice.updateToken(updateDeviceAttrs, function(err, updatedDevice) {
    if(err) {
      return res.ext.error(err).render();
    }
    res.ext.data(_.findWhere(updatedDevice.toObject().devices, { deviceId: updateDeviceAttrs.deviceId })).render();
  });
}


PushController.prototype.event = function(req, res, next) {
  var config = Config.getConfig();

  if(!req.query.secret || req.query.secret !== config.push.serverSecret) {
    return res.ext.error('Bad request').render();
  }

  var pushAttrs = _.pick(req.body, [ 'subscriberId', 'payload', 'alert', 'options' ]);
  this.sendMessage(pushAttrs, function(err, devices) {
    if(err) {
      return res.ext.error(err).render();
    }

    res.ext.data({ status: 'pushed event successfully', devices: devices }).render();
  });

}


PushController.prototype.sendMessage = function(pushAttrs, callback) {
  var self = this;
  UserDevice.findOne({ subscriberId: pushAttrs.subscriberId }, function(err, userDevice) {
    if(err) {
      return callback(err);
    }

    if(!userDevice) {
      return callback('user device not found');
    }

    userDevice = userDevice.toObject();

    var devices = [];
    var status;
    _.each(userDevice.devices, function(device) {
      status = self.iosPushService.sendMessage(device.deviceToken, pushAttrs.payload || {}, pushAttrs.alert, pushAttrs.options || {});
      devices.push({
        deviceId: device.deviceId,
        status: (status === true) ? 'success' : status
      });
    });

    return callback(null, devices);
  });
}

module.exports = new PushController();
