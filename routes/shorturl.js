
var ShortUrlController = require('../controller/shorturl').ShortUrlController


module.exports.public = function(app) {

  app.get('/x/:shortURICode', ShortUrlController.unshorten.bind(ShortUrlController));

}