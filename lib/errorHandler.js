var fs = require('fs');

exports = module.exports = function errorHandler(options){
    options = options || {};
	// defaults
	var showStack = options.showStack
		, showMessage = options.showMessage;

	return function errorHandler(err, req, res, next){
		logger.error(err.stack);

	    res.statusCode = 500;

		var accept = req.headers.accept || '';
	    if(showStack) {
			// html
			if (~accept.indexOf('html')) {
				res.render('error.jade', {
					  title: 'Error 500'
					, stack: err.stack || ''
					, error: err.toString()
				});
			// json
			} else if (~accept.indexOf('json')) {
				var json = JSON.stringify({ error: err });
				res.setHeader('Content-Type', 'application/json');
				res.end(json);
			// plain text
			} else {
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end(err.stack);
			}
	    }else{
			// public error page render
			// html
		  	if (~accept.indexOf('html')) {
				res.render('error.jade', {
							    title: 'Error'
							  , error: err.toString()
						});
			// json
			} else if (~accept.indexOf('json')) {
				var json = JSON.stringify({ error: "There was a server error generating the content." });
				res.setHeader('Content-Type', 'application/json');
				res.end(json);
			// plain text
			} else {
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end("500 - Server Error");
			}
	    }
	};
};