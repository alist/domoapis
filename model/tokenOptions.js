
var _ = require('lodash')
  , Auth = require('token')
  , Config = require('../configLoader')
  , errors = require('./errors').errors


var options = module.exports.options = {
  secret: 'unpr3d1ct@bl3str1ngF0ll0ws-owkcfjefoe93msl4',
  timeStep: 7 * 24 * 60 * 60,
  schemaKey: '_id',
  transformToken: null
};


module.exports.addToSchema = function(schema, opts) {

  opts = _.defaults(opts || {}, options);
  Auth.defaults.secret = opts.secret;
  Auth.defaults.timeStep = opts.timeStep;

  schema.add({
    tokens: [
        {
            service:    { type: String, required: true },
            token:      { type: String, required: true }
        }
      ]
  });


  var getTokenKey = function(model, service) {
    return service + '|' + model[opts.schemaKey];
  }

  var checkToken = function(tokenKey, token) {
    return Auth.verify(tokenKey, token) === Auth.VALID;
  }

  var genToken = function(tokenKey) {
    return Auth.generate(tokenKey);
  }


  schema.methods.getToken = function(service, shouldSave, shouldTransformToken, callback) {

    if(typeof shouldSave === 'function') {
      // fn(service, callback)
      callback = shouldSave;
      shouldSave = true;
      transformToken = false;
    }

    if(typeof transformToken === 'function') {
      // fn(service, shouldSave, callback)
      callback = transformToken;
      transformToken = false;
    }

    var fnTransform = opts.transformToken;
    fnTransform = (shouldTransformToken && typeof fnTransform === 'function') ? fnTransform.bind(this) : _.identity;

    var tokenKey = getTokenKey(this, service);

    if(this.tokens.length) {
      var fetchedToken = _.findWhere(this.tokens, { service: service });
      if(fetchedToken && checkToken(tokenKey, fetchedToken.token)) {
        return callback(null, this, fnTransform(fetchedToken.token));
      }
    }

    var self = this;

    var serviceToken = { service: service };
    serviceToken.token = genToken(getTokenKey(this, service));
    this.tokens.push(serviceToken);

    if(!shouldSave) {
      return callback(null, self, fnTransform(serviceToken.token));
    }

    this.save(function(err) {
      if(err) {
        return callback(err);
      }
      return callback(null, self, fnTransform(serviceToken.token));
    });
  }


  schema.methods.removeTokenByFilter = function(filter, errType, callback) {
    if(!filter || typeof filter !== 'object') {
        return callback(errors['INVALID_ARG']('filter'));
    }

    if(!errType || typeof errType !== 'string') {
        return callback(errors['INVALID_ARG']('errType'));
    }

    if(!this.tokens.length) {
        return callback(errors[errType]());
    }

    var fetchedToken = _.findWhere(this.tokens, filter);
    if(!fetchedToken) {
        return callback(errors[errType]());
    }

    fetchedToken.remove();

    var self = this;
    this.save(function(err) {
        if(err) {
            return callback(err);
        }
        return callback(null, self.tokens);
    });
  }


  schema.methods.removeService = function(service, callback) {
    this.removeTokenByFilter({ service: service }, 'SERVICE_NOT_FOUND', callback);
  }


  schema.methods.removeToken = function(token, callback) {
    this.removeTokenByFilter({ token: token }, 'TOKEN_NOT_FOUND', callback);
  }


  // token belongs to user?
  schema.methods.hasToken = function(token) {
    var fetchedToken = _.findWhere(this.tokens, { token: token });
    return !!fetchedToken;
  }

  // token belongs to user for service?
  schema.methods.hasServiceToken = function(service, token) {
    var fetchedToken = _.findWhere(this.tokens, { service: service, token: token });
    return !!fetchedToken;
  }

  // token belongs to user for service and is valid?
  schema.methods.isTokenValid = function(service, token) {
    return this.hasServiceToken(service, token) && checkToken(getTokenKey(this, service), token);
  }

}
