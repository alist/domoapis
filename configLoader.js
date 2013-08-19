var _ = require('lodash')
  , conf = require('./config')


var ConfigLoader = function() {
	
  var self = this;

  [ 'defaultsKey', 'overridesKey', 'envList', 'activeEnv' ].forEach(function(k){
    self[k] = conf[k];
  });

};

ConfigLoader.prototype.forceEnv = function(env, skipOverrides){
  this.forcedEnv = env;
  this.skipOverrides = skipOverrides;
  return this;
}

ConfigLoader.prototype.init = function(){
  this.config = {};

  var self = this;

	var validEnvs = self.envList;
	validEnvs.push(self.defaultsKey);

  if(this.forcedEnv) {
    this.activeEnv = this.forcedEnv;
  } else {
    this.activeEnv = conf.activeEnv;
  }
  
  var skipOverrides = this.skipOverrides || false;

  if(!_.contains(validEnvs, this.activeEnv)) {
    throw new Error('Invalid env: ' + this.activeEnv);
  }
  
	var validEnvsLen = validEnvs.length;

	_.each(conf, function(v, k){  // app, db, mail, redis
		if(_.isObject(v) && _.difference(validEnvs, _.keys(v)).length < validEnvsLen){
      self.config[k] = mergeObjects(v[self.activeEnv] || {}, v.defaults || {});

      if(!!v.overrides && !skipOverrides){
        self.overrideProps(self.config[k], v.overrides);
      }
		}
	});

  // chainable
  return this;
}

ConfigLoader.prototype.overrideProps = function(dest, overrides){
  _.merge(dest, overrides, function(destVal, overrideVal){
    if(!!overrideVal && !_.isObject(overrideVal)){
      // if it's an array or a value, assign (skips if override value is undefined/null)
      return overrideVal;
    }
  });
}

ConfigLoader.prototype.getActiveEnv = function(){
	return this.activeEnv;
}

ConfigLoader.prototype.getConfig = function(){
  return this.config;
}



var mergeObjects = function() {
  var mergeArgs = _.toArray(arguments);
  mergeArgs.push(function(destVal, defVal){
    if(_.isArray(defVal) || !_.isObject(defVal) || _.isArray(destVal) || !_.isObject(destVal)) {
      return destVal || defVal;
    }
  });
  return _.merge.apply(this, mergeArgs);
}



var configLoader = new ConfigLoader();

module.exports.ConfigLoader = ConfigLoader;

[ 'init', 'forceEnv', 'getConfig' ].forEach(function(f){
  module.exports[f] = configLoader[f].bind(configLoader);
});

