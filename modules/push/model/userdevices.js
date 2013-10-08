
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , errors = require('../../../model/errors').errors
  , uuid = require('node-uuid')


var userDeviceSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: 'user', required: true,  index: { unique: true } },
  devices: [
    {
      deviceId:       { type: String },
      deviceType:     { type: String },
      deviceToken:    { type: String },
      deviceMeta:     { type: Schema.Types.Mixed }
    }
  ]
});


userDeviceSchema.statics.register = function(newDeviceAttrs, callback) {
  var newUserDevice = new UserDevice();
  newUserDevice.userId = newDeviceAttrs.userId;
  newUserDevice.devices.push({
    deviceId: uuid.v4().replace(/-/g, ''),
    deviceType: newDeviceAttrs.deviceType,
    deviceToken: newDeviceAttrs.deviceToken,
    deviceMeta: newDeviceAttrs.deviceMeta
  });

  newUserDevice.save(function(err) {
    if(err){
      return callback(errors['DB_FAIL'](err));
    }

    return callback(null, newUserDevice);
  });
}


userDeviceSchema.statics.updateToken = function(updateAttrs, callback) {
  UserDevice.findOneAndUpdate(
    {
      'userId': updateAttrs.userId,
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
        return callback(errors['USER_NOT_FOUND'](err));
      }

      return callback(null, userDevice);
    });
}


var UserDevice = module.exports.UserDevice = mongoose.model('userdevices', userDeviceSchema, 'userdevices');
