
var ShortUrlModel = require('../model/shorturl').ShortUrl


var ShortUrlController = function() {

}


ShortUrlController.prototype.unshorten = function(req, res, next) {

  var shortURICode = req.params.shortURICode;
  var userIP = req.header('x-forwarded-for') || req.ip;
  // TODO: Validations

  ShortUrlModel.retrieve(shortURICode, { userIP: userIP }, function(err, shorturl) {
    if(!shorturl) {
      return next();
    }

    return res.redirect(shorturl.redirectURI);
  });
}


module.exports.ShortUrlController = new ShortUrlController();