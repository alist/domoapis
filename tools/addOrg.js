

// set environment here (or shell env will be used)
var env = 'test'; //process.env.NODE_ENV;

// set attribs for new organization
var newOrganization =  {
	"displayName": "Massachusetts Institute of Technology",
	"orgURL": "mit",
	"city": "Cambridge",
	"region": "MA",
	"bannerURL": "/img/banners/mit.jpg",
	"code": "mit9"
};









// CODE

var opWait = 10;

var forcedEnv = env || ((typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'test');

var configLoader = require('../configLoader').forceEnv(forcedEnv, true).init()
  , config = configLoader.getConfig()
  , util = require('util')
  , mongoose = require('mongoose')
  , Organization = require('../model/organization').Organization


var print = function(name, obj){
  if(arguments.length == 1){
    obj = name;
    name = '';
  }

  if(typeof obj === 'string') {
  	console.log(name, obj);
  } else {
  	console.log(name, util.inspect(obj, { depth: null }));
  }
}


print('Using environment', configLoader.activeEnv);
print('[ENSURE THIS IS AS DESIRED] Connecting to database', config.db.dbUri);

print('\nExecuting in ' + opWait + ' secs\n');
print('Press Ctrl+C to cancel\n');

var i = opWait;
var tmr = setInterval(function() {
	print(--i + '...')

	if(i <= 0) {
		clearInterval(tmr);
		newOrg(config, newOrganization);
	}
}, 1000);



function newOrg(config, newOrganization) {
	mongoose.connect(config.db.dbUri, function(err) {
		if(err) {
			throw err;
		}

		Organization.find({}).sort({ id: -1 }).limit(1).exec(function(err, docs) {
			if(err) {
				throw err;
			}

			newOrganization.id = (docs.length < 1) ? '1' : (+docs[0].id + 1);

			print('newOrganization.id', newOrganization.id);

			Organization.new(newOrganization, function(err, newOrg) {
				if(err) {
					throw err;
				}

				print('Successfully created', newOrg);
			});
		});


	});
}
