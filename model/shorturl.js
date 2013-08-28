var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require("crypto")
  , errors = require('./errors').errors


var shorturlSchema = new Schema({
  modifiedDate:     { type: Date },
  redirectURI:      { type: String },
  shortURICode:     { type: String, required: true, unique: true, index: true },
  isCustomCode:     { type: Boolean },
  redirectCount:    { type: Number, default: 0 },
  redirects:        [ { accessDate: Date, userinfo: {} } ],
  creatorUserInfo:  {}
});


shorturlSchema.statics.shorten = function(shorteningURI, opts, callback) {

  if(typeof opts === 'function') {
    // (shorteningURI, callback)
    callback = opts;
    opts = {};
  }

  var options = {
    minLength: opts.minLength || 5,
    shouldReuseCode: opts.shouldReuseCode || true,
    customCode: opts.customCode,
    userInfo: opts.userInfo || {}
  };

  var addCodeToDatabase, genCode, generateTries, makeNewCode,
    _this = this;

  if ((shorteningURI !== null) === false) {
    callback('no uri included for shortening');
    return;
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

  var generateTries = 0;

  addCodeToDatabase = function(code, failCallback) {
    var setInfo, short;
    setInfo = {
      modifiedDate: new Date(),
      shortURICode: code,
      creatorUserInfo: options.userInfo,
      isCustomCode: !!options.customCode,
      redirectURI: shorteningURI
    };

    short = new ShortUrl(setInfo);
    return short.save(function(err, savedShortURL) {
      if (err) {
        return failCallback(code, err, failCallback);
      } else {
        return callback(null, savedShortURL);
      }
    });
  };

  makeNewCode = function() {
    var firstCode = options.customCode;
    if (!firstCode) {
      firstCode = genCode(options.minLength);
    }

    return addCodeToDatabase(firstCode, function(code, err, thisSameFunction) {
      var charsAdded, nextCode;
      if (options.customCode !== null) {
        callback(err);
        return;
      }
      generateTries = generateTries + 1;
      charsAdded = Math.floor(generateTries / 3);
      nextCode = genCode(options.minLength + charsAdded);
      return addCodeToDatabase(nextCode, thisSameFunction);
    });
  };

  if (options.shouldReuseCode) {
    return ShortUrl.findOne({
      redirectURI: shorteningURI,
      isCustomCode: false
    }, null, function(error, shortened) {
      if (shortened) {
        return callback(null, shortened);
      } else {
        return makeNewCode();
      }
    });
  } else {
    return makeNewCode();
  }
}


shorturlSchema.statics.retrieve = function(shortURICode, userInfo, callback) {

  if(!shortURICode) {
    return callback("no shortURICode provided");
  }

  var updates = {
    $push: {
      redirects: {
          accessDate: new Date(),
          userInfo: userInfo
      }
    },
    $inc: {
      redirectCount: 1
    },
    $set: {
      modifiedDate: new Date()
    }
  };

  ShortUrl.findOneAndUpdate({ shortURICode: shortURICode }, updates, function(err, shortened) {
    if (!shortened) {
      console.log("shortURILookup for " + shortURICode + " failed w. error " + err);
      callback("no shorturi redirect found");
    } else {
      callback(null, shortened);
    }
  });
}


var ShortUrl = module.exports.ShortUrl = mongoose.model('shorturl', shorturlSchema, 'shorturl');
