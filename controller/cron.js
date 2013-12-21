var async = require('async'),
    moment = require('../modules/moment.min')

var OrganizationModel = require("../model/organization").Organization,
	  OrgUserModel = require("../model/orguser").OrgUser,
    AdviceRequestModel = require("../model/advicerequest").AdviceRequest

var checkAssignments = function(){

	OrganizationModel.find().exec(function(err,organizations){
		if(err)
			return console.log('Error occurred updating assignments in cron job')

    async.each(organizations,function(org,callback){

      var supporters = []
      var adviceRequests = []

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
            })


            cb(null)
          })
        },

        findAdviceRequests : function(cb){
          AdviceRequestModel.find({organization : org._id, assignedSupportersCount : {$lt : 3} }).exec(function(err,advRequests){
            if(err)
              return console.log('Error occurred updating assignments in cron job')
            adviceRequests = advRequests

            cb(null)
          })
        }
      },function(err,cbs){
        var updatedAdvr = []

        var assigned = {}

        adviceRequests.forEach(function(adv,i){
          supporters.forEach(function(sup,j){
            if(adv.assignedSupporters.indexOf(sup.toString()) == -1 && adv.assignedSupportersCount < 5 && !assigned[sup]){
              adv.assignedSupporters.push(sup)
              adv.assignedSupportersCount += 1
              updatedAdvr.push(adv)
              assigned[sup] = 1
            }
          })
        })

        async.each(updatedAdvr,function(updadvr,cb_inner){
          updadvr.save(function(err,savedadvr){
            if(err)
              console.log(err) //don't break
            cb_inner(null)
          })
        },function(err){
          //all are now saved
          if(updatedAdvr.length > 0)
            console.log(updatedAdvr.length + ' advice requests assigned in organization ' + org.displayName)
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

exports.checkAssignments = checkAssignments