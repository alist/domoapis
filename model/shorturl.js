var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , _ = require("lodash")
  , crypto = require("crypto")
  , errors = require('./errors').errors
  
//var ObjectId = mongoose.SchemaTypes.ObjectId;

var shorturlSchema = new Schema({
  modifiedDate:     { type: Date },
  redirectURI:      { type: String },
  shortURICode:     { type: String, required: true, unique: true, index: true },
  isCustomCode:     { type: Boolean },
  redirectCount:    { type: Number },
  redirects:        [ { accessDate: Date, userinfo: {} } ],
  creatorUserInfo:  {}
});

var schemaAttrs = _.keys(shorturlSchema.paths);


shorturlSchema.statics.shorten = function(shorteningURI, minLength, domain, shouldReuseCode, customCode, userInfo, callback) {
  var addCodeToDatabase, genCode, generateTries, makeNewCode,
    _this = this;
  if ((shorteningURI !== null) === false) {
    callback('no uri included for shortening');
    return;
  }
  if ((domain !== null) === true && shorteningURI.substr(0, domain.length) !== domain) {
    callback("invalid domain for shorteningURI: domain(" + domain + ") uri(" + shorteningURI + ")");
    return;
  }
  if ((minLength !== null) === false || minLength === 0) {
    minLength = 5;
  }
  genCode = function(length) {
    var current_date, hash, random;
    current_date = (new Date()).valueOf().toString();
    random = Math.random().toString();
    hash = crypto.createHash('sha1').update(current_date + random + shorteningURI).digest('base64');
    hash = hash.replace(/\//g, '');
    if (length > hash.length) {
      return hash;
    } else {
      return hash.substr(0, length);
    }
  };
  generateTries = 0;
  addCodeToDatabase = function(code, failCallback) {
    var setInfo, short;
    setInfo = {
      modifiedDate: new Date(),
      shortURICode: code,
      creatorUserInfo: userInfo,
      isCustomCode: (customCode !== null),
      redirectURI: shorteningURI
    };
    short = new ShortUrl(setInfo);
    return short.save(function(err, savedShortURL) {
      if ((err !== null) === true) {
        return failCallback(code, err, failCallback);
      } else {
        return callback(null, savedShortURL);
      }
    });
  };
  makeNewCode = function() {
    var firstCode;
    firstCode = customCode;
    if ((firstCode !== null) === false) {
      firstCode = genCode(minLength);
    }
    return addCodeToDatabase(firstCode, function(code, err, thisSameFunction) {
      var charsAdded, nextCode;
      if (customCode !== null) {
        callback(err);
        return;
      }
      generateTries = generateTries + 1;
      charsAdded = Math.floor(generateTries / 3);
      nextCode = genCode(minLength + charsAdded);
      return addCodeToDatabase(nextCode, thisSameFunction);
    });
  };
  if (shouldReuseCode) {
    return ShortUrl.findOne({
      redirectURI: shorteningURI,
      isCustomCode: false
    }, null, function(error, shortened) {
      if (shortened !== null) {
        return callback(null, shortened);
      } else {
        return makeNewCode();
      }
    });
  } else {
    return makeNewCode();
  }
}

shorturlSchema.retrieve = function(shortURICode, userInfo, callback) {
  if ((shortURICode !== null) === true) {
    return ShortUrl.findOne({
      shortURICode: shortURICode
    }, null, function(err, shortened) {
      var _this = this;
      if ((shortened !== null) === false) {
        console.log("shortURILookup for " + shortURICode + " failed w. error " + err);
        callback("no shorturi redirect found");
      } else {
        shortened.modifiedDate = new Date();
        if ((shortened.redirectCount !== null) === false) {
          shortened.redirectCount = 0;
        }
        shortened.redirectCount.$inc(1);
        if ((shortened.redirects !== null) === false) {
          shortened.redirects = [];
        }
        shortened.redirects.$push({
          accessDate: new Date(),
          userInfo: userInfo
        });
        callback(null, shortened);
        return shortened.save(function(err) {
          if ((err !== null) === true) {
            return console.log("error updating stats for retreive " + err);
          }
        });
      }
    });
  } else {
    return callback("no shortURICode provided");
  }
}


var ShortUrl = module.exports.ShortUrl = mongoose.model('shorturl', shorturlSchema, 'shorturl');