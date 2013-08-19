
exports = module.exports = function errorHandler(options){

  options = options || {};

	var showStack = options.showStack
		, showMessage = options.showMessage;

	var errView = options.errView;

	if(!errView){
		throw new Error('No error view specified.');
	}


	return function errorHandler(err, req, res, next){

		console.log(err.stack);
    res.statusCode = 500;

		var accept = req.headers.accept || '';

		if (~accept.indexOf('html')) {
			var resObject = {
				  title: 'Error 500'
				, error: err.toString()
			};
			if(showStack){
				resObject.stack = err.stack || '';
			}
			res.render(errView, resObject);
			return;
		} 

		if (~accept.indexOf('json')) {
			var json;
			showStack ? 
				(json = JSON.stringify({ error: err })) : 
				(json = JSON.stringify({ error: "There was a server error generating the content." }))

			res.setHeader('Content-Type', 'application/json');
			res.end(json);
			return;
		}

		res.writeHead(500, { 'Content-Type': 'text/plain' });
		showStack ?
			(res.end(err.stack)) :
			(res.end("500 - Server Error"))

	};
};