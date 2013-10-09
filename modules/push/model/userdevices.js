
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , errors = require('../../../model/errors').errors
  , uuid = require('node-uuid')


var userDeviceSchema = new Schema({
  subscriberId:  { type: String, required: true,  index: { unique: true } },
  devices: [
    {
      deviceId:       { type: String, required: true },
      deviceType:     { type: String, required: true },
      deviceToken:    { type: String, required: true },
      deviceMeta:     { type: Schema.Types.Mixed }
    }
  ]
});


userDeviceSchema.statics.register = function(newDeviceAttrs, callback) {
  var newUserDevice = new UserDevice();
  newUserDevice.subscriberId = newDeviceAttrs.subscriberId || uuid.v1().replace(/\-/g, '');
  newUserDevice.devices.push({
    deviceId: uuid.v1().replace(/-/g, ''),
    deviceType: newDeviceAttrs.deviceType,
    deviceToken: newDeviceAttrs.deviceToken,
    deviceMeta: newDeviceAttrs.deviceMeta
  });

  newUserDevice.save(function(err) {
    if(err){
      console.log(err)
      return callback(errors['DB_FAIL'](err));
    }

    return callback(null, newUserDevice);
  });
}


userDeviceSchema.statics.updateToken = function(updateAttrs, callback) {
  UserDevice.findOneAndUpdate(
    {
      'subscriberId': updateAttrs.subscriberId,
      'devices.deviceId': updateAttrs.deviceId
    },
    {
      '$set': {
        'devices.$.deviceToken': updateAttrs.deviceToken
      }
    },
    function(err, userDevice) {
      if(err){
        return callback(errors['DB_FAIL'](err));
      }

      if(!userDevice) {
        return callback(errors['USER_DEVICE_NOT_FOUND'](err));
      }

      return callback(null, userDevice);
    });
}


var UserDevice = module.exports.UserDevice = mongoose.model('userdevices', userDeviceSchema, 'userdevices');
