var async = require('async'),
    moment = require('../modules/moment.min')

var OrganizationModel = require("../model/organization").Organization,
	  OrgUserModel = require("../model/orguser").OrgUser,
    AdviceRequestModel = require("../model/advicerequest").AdviceRequest

var jade = require('jade'),
    Config = require('../configLoader'),
    path = require('path')    

var checkAssignments = function(){

	OrganizationModel.find().exec(function(err,organizations){
		if(err)
			return console.log('Error occurred updating assignments in cron job')
    async.each(organizations,function(org,callback){

      var supporters = []
      var adviceRequests = []
      var supporterEmailHash = {}

      // //hnk+ cron.js emulates (sort of) the cron job functionality but we lose the ability to stream output ($HOME/bin/daily.job >> $HOME/tmp/out 2>&1) {
      // var fs = require('fs'),
      //     config = Config.init().getConfig(),
      //     env = config.env;
      // process.__defineGetter__('stderr', function() { return fs.createWriteStream(config.app.env.rootDir + '/assignments.error.log', {flags:'a'}) })  
      // process.__defineGetter__('stdout', function() { return fs.createWriteStream(config.app.env.rootDir + '/assignments.access.log', {flags:'a'}) })  //hnk+}

      async.parallel({
        findSupporters : function(cb){
          OrgUserModel.find({orgId : org._id}).exec(function(err,orgusers){
            if(err)
              return cb('db query error occurred')

            var now = moment()
            var day = now.format('dddd').toLowerCase()
            var minsToday = getMins(now.format('h:mm a'))

            orgusers.forEach(function(orguser,i){
              var available = false
              orguser.times.forEach(function(time,j){
                if(time.day == day && time.begin <= minsToday && minsToday < time.end)
                  available = true
              })
              if(available)
                supporters.push(orguser._id)
                supporterEmailHash[orguser._id.toString()] = orguser.email //this is a hack; dont want to disturb the overall chi of the code//hnk+
            })


            cb(null)
          })
        },

        findAdviceRequests : function(cb){
          //console.log(supporters.length, Object.keys(supporterEmailHash).length)
          AdviceRequestModel.find({organization : org._id, assignedSupportersCount : {$lt : 3} }).exec(function(err,advRequests){
            if(err)
              return console.log('Error occurred updating assignments in cron job')
            adviceRequests = advRequests

            cb(null)
          })
        }
      },function(err,cbs){
        var updatedAdvr = []

        var assigned = {} //add supporter to here so that they are assigned only once

        async.series([
          function(cb_mid){
            async.each(adviceRequests,function(adv,cb_inter){
              async.each(supporters,function(sup,cb_inner){
                if(adv.assignedSupporters.indexOf(sup.toString()) == -1 && adv.assignedSupportersCount < 5 && !assigned[sup]){
                  adv.assignedSupporters.push(sup)
                  adv.assignedSupportersCount += 1
                  updatedAdvr.push(adv)
                  assigned[sup] = 1
                  OrgUserModel.findById(sup).exec(function(err,orguser){
                    if(err)
                      return console.log(err)
                    orguser.assignedCount += 1
                    orguser.save(function(err){
                      if(err)
                        console.log(err)
                      cb_inner(null)
                    })
                  })
                }
              },function(){
                cb_inter(null)
              })
            },function(){
              cb_mid()
            })
          },

          function(cb_mid){
            async.each(updatedAdvr,function(updadvr,cb_inner){
              updadvr.save(function(err){
                if(err){
                  console.log(err) //don't break
                }
                else{
                  console.log('About to email supporters')  
                  //console.log(supporterEmailHash)
                  emailRelevantSupporters(cb_inner,supporterEmailHash,org,updadvr.toJSON()) //this is a hack //hnk+
                }
              })
              //if (!err){
                // console.log('About to email supporters')
                //console.log(supporterEmailHash)
                //emailRelevantSupporters(supporterEmailHash,org,updadvr) //this is a hack //hnk+
              //}
              //else{
                //console.log(err)
              //}
            },function(err){
              //all are now saved
              if(updatedAdvr.length > 0)
                console.log(updatedAdvr.length + ' advice requests assigned in organization ' + org.displayName)
              cb_mid()
            })
          }
        ],function(){
          callback(null)
        })
		  })
    },function(err,callbacks){
        console.log('cronjob at ' + moment().format('h:mm a') + ' complete')
    })
  })
}

//helper func
function getMins(timeString){
  timeString = timeString.toLowerCase()
  var tsArr = timeString.split(' ')
  var hm = tsArr[0].split(':')

  var mins = hm[1]
  var hours
  if(tsArr[1] == 'pm'){
    if(hm[0] != '12')
      hours = hm[0]*1 + 12
    else
      hours = 12
  }
  else{
    if(hm[0] != '12')
      hours = hm[0]*1
    else
      hours = 0
  }
  return parseInt(hours)*60 + parseInt(mins)
}

function emailRelevantSupporters(cb,supporterEmailHash, org, advicerequest){
  // build html for mail
  var config = Config.getConfig()
  var mailTmplPath = path.join(config.app.env.rootDir, 'views', 'mailer', 'newAdviceRequest.jade')
  var mailer = require('../lib/mailer')

  console.log('Entered email module')
  advicerequest.accessURL = 'https://' + config.app.primaryhost + advicerequest.accessURL
  console.log(advicerequest.accessURL)
  jade.renderFile(mailTmplPath, { org: org, advicerequest: advicerequest }, function(err, mailHtml) {

    // run upto 5 parallel tasks to send e-mail
    console.log('Generating template....emailing')
    async.eachLimit(advicerequest.assignedSupporters, 5, function(assignedSupporter, next) {

      var email = supporterEmailHash[assignedSupporter.toString()]
      console.log('Sending message to supporter', email);

      mailer.sendMessage({
        to: email,
        subject: 'Domo: New Advice Request',
        html: mailHtml
      }, next);

    }, function(err) {
      if(err) {
        //return console.log('Error notifying supporters:', err);
      }
      cb(null);
    });

  });  
}

exports.checkAssignments = checkAssignments