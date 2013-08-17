
module.exports = function errorHandler(options){
  options = options || {};

	var showStack = options.showStack
		, dumpExceptions = options.dumpExceptions;

	var errView = options.errView;

	if(!errView){
		throw new Error('No error view specified.');
	}

	return function(err, req, res, next){

		if(dumpExceptions) {
			console.log(err.stack);
    	console.log('uncaughtException', err.message);
		}

		res.ext.code(500);
		res.ext.view(errView);
		res.ext.viewData({ title: 'Error 500' });

		if(showStack){
			res.ext.data({ stack: err.stack || '' });
		}

		showStack ? 
			(res.ext.error(err)) : 
			(res.ext.error("There was a server error generating the content."));

		res.ext.render();
	};
};