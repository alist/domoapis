var config = require('../config').config
    , _ = require('lodash')
    , util = require('util')



module.exports.print = function(name, obj){
  if(arguments.length == 1){
    obj = name;
    name = '';
  }
  console.log(name, util.inspect(obj, { depth: null }));
}



module.exports.getDomainFromRequest = function(req) {
	return req.protocol + '://' + req.host  + ':' + config.env.port;
}
