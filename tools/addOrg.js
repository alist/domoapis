// set environment here (or shell env will be used)
var env = 'test'; //process.env.NODE_ENV;

// set attribs for new organization
var newOrganization =  {
	"displayName": "Domo Support",
  "usageDescription": "Use this organization to get support for Domo itself. Code: 'Domo'",
	"orgURL": "support",
	"city": "Cambridge",
	"region": "MA",
	"bannerURL": "/img/banners/domoers.png",
	"code": "Domo",
  "supportAreas": [
        {
            "identifier": "career",
            "name": "career concerns"
        },
        {
            "identifier": "balance",
            "name": "study-life balance"
        },
        {
            "identifier": "family",
            "name": "family matters"
        },
        {
            "identifier": "spirituality",
            "name": "spirituality/ religion"
        },
        {
            "identifier": "funculture",
            "name": "fun & culture"
        },
        {
            "identifier": "otherconcerns",
            "name": "other things"
        }
    ]
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
print('Adding: ', newOrganization);

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

		Organization.count(function(err, count) {
			if(err) {
				throw err;
			}

			newOrganization.id = count + 1

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
