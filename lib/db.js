var mongoose = require('mongoose')
  , logger = require('../lib/logger')
  , config = require('../config').config;

module.exports = function(app, next){

    this.next = next;
	var self = this;

	self.init = function(){
		var uristring = config.dbUri;
		mongoose.connect(uristring, function (err, res) {
			if(err){ 
				logger.error('ERROR connecting to: ' + uristring + '. ' + err);
				self.next(err);
				return;
			}
		  logger.info('Connected to: ' + uristring);
		  	
			self.next();
		});
	}

	self.init();
};