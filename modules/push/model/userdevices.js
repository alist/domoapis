var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , errors = require('../../../model/errors').errors


var userDevicesSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'user', required: true,  index: { unique: true } },
  devices: [
    {
      deviceType: { type: String },
      deviceToken: [ { type: String, index: { unique: true } } ]
    }
  ]
});

var UserDevices = module.exports.UserDevices = mongoose.model('userdevices', userDevicesSchema, 'userdevices');