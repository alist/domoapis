var winston = require('winston')
  , util = require('util');

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ colorize: true }),
      new (winston.transports.File)({ level: 'error', filename: '../error.log' }),
    ],
    levels: {
        info: 0,
    	warn: 1,
    	error: 2,
    	trace: 3
    }
});

winston.addColors({
	trace: 'yellow'
});

logger.inspect = function(obj, level){
    if(typeof level == 'undefined'){
        level = null
    }
    logger.info(util.inspect(obj, false, level));
}

module.exports = global.logger = logger;