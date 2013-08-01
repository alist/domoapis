var DBConfig = {

    "production": {
		"live": {
			"primaryhost": "domo-io.herokuapp.com",
            "host": "ds031597.mongolab.com",
            "port": "31597",
            "user": "domo",
			"password": "c0mpl3xity",
            "db": "domo"
		}
	},
	"development": {
		"dev": {
    		"primaryhost": "domo-io.herokuapp.com",
            "host": "ds031597.mongolab.com",
            "port": "31597",
            "user": "domo",
    		"password": "c0mpl3xity",
            "db": "domo"
		}		
	},
	"test": {
		"test": {
    		"primaryhost": "domo-io.herokuapp.com",
            "host": "ds059887.mongolab.com",
            "port": "59887",
            "user": "domo",
    		"password": "c0mpl3xity",
            "db": "domo_test"
		}		
	},


	getConfig: function(env){
		return this[env];
	},
	constructConfigUrl: function(user, pass, port, host, db){
        //mongodb://domomain:CvB8KBKd3qH9db@dbh62.mongolab.com:27627/heroku_app15761281
		return "mongodb://" + user + ":" + pass + "@" + host + ":" + port + "/" + db;
	},
	getConfigUrl: function(env, dbName){
		//var p = port || 27017;
		var config = this.getConfig(env);
		
		for(db in config){
			if(!!dbName){
				// dbName provided
				if(db === dbName){
					return this.constructConfigUrl(config[db].user, config[db].password, config[db].port, config[db].host, config[db].db);
				}
			} else {
				// dbName not provided. Return first db
				return this.constructConfigUrl(config[db].user, config[db].password, config[db].port, config[db].host, config[db].db);
			}
		}
	}
};

// For mongodb shell script
if(typeof module === 'undefined'){
	module = {};
}

module.exports = DBConfig;