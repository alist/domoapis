var DBConfig = require('./dbConfig')
  , UserController = require('./controller/user').UserController
  , logger = require('./lib/logger')
  , errorHandler = require('./lib/errorHandler')
  , Validator = require('validator').Validator
  , flash = require('connect-flash')
  , _ = require('underscore')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;



var Config = function() {

	var self = this;
	var envList = [ 'production', 'development', 'staging' ];

	var commonConfig = {
		api: {
			endpoint: '/api/',
			version: '1',
			path: '/api/v1'
		},
		userTypes: [ 'supporter', 'supportee', 'moduleadmin', 'admin', 'adopter' ],
		defaultUserType: 'supporter',
		env: {
			port: process.env.PORT || 3000,
			rootDir: __dirname
		}
	};

	self.configState = {};
	
	envList.forEach(function(env){
		self.configState[env] = {};
		_.extend(self.configState[env], commonConfig, {
			dbUri: process.env.MONGODB_URI || DBConfig.getConfigUrl(env)
		});
	});


	var app, express = null;
	this.env, this.config = null;


	this.init = function(_app, _express, next){
		
		if(typeof next !== 'function'){
			return next(new Error('Expected callback fn'));
		}

		app = _app;
		express = _express;

		this.configValidator();
		this.catchExceptions();
		this.configEnv();
		this.configExpress();
		return next(null, this.config);
	}
	

	this.configExpress = function (){
		var config = this.config;

		app.set('views', config.env.rootDir + '/views');
		app.set('view engine', 'jade');

		app.use(express.favicon());
		app.use(express.bodyParser());

		// session support
		app.use(express.cookieParser());

		var sessionConfig = {
		    key: '_sess',
		    secret: 'dasds21dkds22as2jsjsad%'
		};

		if (this.env === 'production') {
			logger.info('Production mode');
		} else {
			logger.info('non-production mode');
            app.locals.pretty = true;
		}

		app.use(express.session(sessionConfig));
		this.passportHooks(app);

		app.use(flash());
		
		var publicFolder = require('path').join(config.env.rootDir, 'public');
		app.use(express.static(publicFolder));

		// Auth middleware
		this.passportAuth(app);

		app.use(express.methodOverride());

		// Note: static/public files here are free from routing
		app.use(app.router);

		if (this.env === 'production') {
			app.use(errorHandler());
		} else {
			app.use(errorHandler({ showMessage: true, dumpExceptions: true, showStack: true }));
		}
	}

	this.configValidator = function(){
		Validator.prototype.hasError = function () {
			return !!(this._errors.length);
		}

		Validator.prototype.error = function (msg) {
		    if(!_.contains(this._errors, msg)){
		      this._errors.push(msg);
		    }
		    return this;
		}

		Validator.prototype.getErrors = function () {
		    return this._errors;
		}
	}

	this.passportHooks = function(app){
		app.use(passport.initialize());
  	    app.use(passport.session());
	}

	this.passportAuth = function(app){

		var config = this.config;

		passport.use(new LocalStrategy({ passReqToCallback: true },
		  function(req, username, password, done) {
	        return UserController.auth(username, password, done);
		  }
		));

		passport.serializeUser(function(user, done) {
		  done(null, user);
		});

		passport.deserializeUser(function(user, done) {
		  UserController.findUserById(user.id, function (err, user) {
		    done(err, user);
		  });
		});
	}

	this.catchExceptions = function(){
		// process.on('uncaughtException', function (err) {
		// 	console.log(err.stack);
	 //    logger.error('uncaughtException', err.message, err.stack);
	 //    process.exit(1);
		// });
	}

	this.getConfig = function(){
		if(!this.env) this.configEnv(); // in case a module refers to getConfig() before configEnv() is done
		return this.config;
	}

	this.configEnv = function(){
		var env = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'development';
		
		if(!this.env) {
			if(!this.configState[env]) {
				logger.error('Unknown environment: "' + env + '". Using "development". Valid: [' + Object.keys(this.configState) + ']'); // default env when nothing's recognized
				env = 'development';
			}

			this.config = this.configState[env];
			this.env = env;
			logger.warn('ENV: ' + this.env);
		}

		return this.env;
	}

};

var config = new Config();
module.exports.config = config.getConfig();
module.exports.init = config.init.bind(config);