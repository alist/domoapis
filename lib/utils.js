var Config = require('../configLoader')
  , util = require('util')



module.exports.print = function(name, obj){
  if(arguments.length == 1){
    obj = name;
    name = '';
  }
  console.log(name, util.inspect(obj, { depth: null }));
}


module.exports.getDomainFromRequest = function(req) {
	return req.protocol + '://' + req.host  + (req.host.match(/herokuapp.com/i) ? '' : ':' + Config.getConfig().app.env.port);
}

