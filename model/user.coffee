secrets = require ('../secrets')
comsModel = require('./communications')

crypto = require('crypto')
mongoose = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

#users are users
UserSchema = new Schema {
  modifiedDate: {type: Date, index: {unique: false}}
  displayName: String
  userID: {type: String, required: true, index: {unique: true}}

  token: {type: String}

  roles: [String] # supporter, supportee, admin, pointperson,reporter,omnipotent
  organization: {type: ObjectId, ref: 'Organization'}
  supportAreas: [{identifier: String, name: String}]

  #need to: unify the coms system 

  # cleanup, cleanup everybody everywhere
  isAdmin: {type: Boolean}
  permissions: [{type: String}]
  imageURI: String
  activeSessionIDs: [ {type: String, index: {unique: true}} ]
  telephoneNumber: {type: String, index: {unique: false}}
  telephoneVerifyDate: {type: Date}
  telephoneNumberVerifyAttemptCount: {type: Number}
  telelphoneVerifyCode: {type: String}
  messageCount: {type: Number} #how many msgs they've received
  overIntervalMessageAllowanceCount: {type: Number} #how many msgs allowed to be sent past the notification interval
  lastNotificationDate: {type: Date, index: {unique: false}}
  notificationInterval: {type: Number}
}

User = mongoose.model 'User', UserSchema
exports.User = User

mongoose.connect(secrets.mongoDBConnectURLSecret)

exports.userLoginURLBase = "https://oh.domo.io/urllogin?token="

genCode = (length, salt) ->
  current_date = (new Date()).valueOf().toString()
  random = Math.random().toString()
  hash = crypto.createHash('sha1').update(current_date + random + salt).digest('base64')
  #assuming not all characters are forward slashes
  hash = hash.replace(/\//g,'')
  if length > hash.length
    return hash
  else return hash.substr(0, length)

exports.getUserWithToken = (token, callback) => #callback (err, user)
  if token? == false
    callback "no token provided for this user"
    return
  User.findOne {token: token},{}, (err, user) =>
    if err? || user? == false
        callback "no user found for token: #{token}"
    else
      callback null, user

exports.authCurrentUserWithIDAndTokenForSession = (userID, fbAToken, sessionToken, callback) -> #callback(err, user)
    if sessionToken? == false
      callback "no sessionToken included for userID user lookup"
      return
    
    #Strategy 1: find existing session
    User.findOne {activeSessionIDs: sessionToken},{}, (err, user) =>
      #console.log "found user w. ID #{user?.userID} for session #{sessionToken}"
      if err? || user? == false
        if userID? == false && fbAToken? == fals#{user.userID}e
          #console.log "impossible to re-auth"
          callback "invalid session- and no re-auth route possible"
          return
        #strategy 2: query fb with fbAToken, then check for existing userIDs of equal to FB's response
        authUserWithFacebookOfIDAndToken userID, fbAToken, (err, fbUserID, fbResponse) =>
          if err? || ((fbUserID != userID) && userID? == true) ##if there is mismatch when userID!=nil
            callback "could not find user with pre-id #{userID} with fbID #{fbUserID} with error #{err}"
          else
            if userID? == false
              #if prior userID was unknown by request, we'll check to see if we have a match right now from FB
              console.log "using recursion to determine if fbUserID exists, now that we know it's #{fbUserID}"
              authCurrentUserWithIDAndTokenForSession fbUserID, fbAToken, sessionToken, callback
            else
              #we've authed the token using FB, and the userID probably exists
              imgURI = "https://graph.facebook.com/#{fbUserID}/picture?type=large&return_ssl_resources=1"
              userInfo = {userID: fbUserID, facebookID: fbUserID, fbAccessToken: fbAToken, imageURI: imgURI, userDisplayName: fbResponse.name, modifiedDate: new Date()}
              userInfo.metroAreaDisplayName = fbResponse.location?.name
              
              console.log "create the user! with info #{userInfo}"
              User.update {userID: fbUserID},{$set: userInfo, $push: { activeSessionIDs: sessionToken}}, {upsert: 1}, (err) ->
                if err?
                  callback "error for user save #{err} with info #{userInfo}"
                else
                  console.log "saved new user with info #{userInfo}, using recursion for auth"
                  authCurrentUserWithIDAndTokenForSession fbUserID, fbAToken, sessionToken, callback
      else
        callback null, user

exports.authUserWithFacebookOfIDAndToken = (fbID, fbToken, callback) -> #callback (err, fbUserID, responseData) #with err if invalid token
    if fbToken? == false
      callback "missing token for fb req"
      return
    requestURL = "https://graph.facebook.com/me?access_token=#{fbToken}"
    #console.log "doing request to fb with url: #{requestURL}"
    request requestURL, (error, response, body) ->
      if error? || response.statusCode != 200
        callback "fbreq err #{error} with code #{response.statusCode}"
        return
      resObjects = JSON.parse body
      if resObjects?.id != fbID
        console.log "fbreq mismatched fbID from req #{fbID} from server #{resObjects?.id}"
      if resObjects?.id? == false
        callback "no fbID returned for token #{fbToken}"
      else
        callback null, resObjects.id, resObjects

exports.getUserWithID = (userID, callback) -> #callback(err, user, abreviatedInfo)
    User.findOne {userID: userID},{fbAccessToken:0, facebookID: 0}, (err, user) =>
      if err? || user? == false
        callback "could not find user of id #{userID} with error #{err}"
      else
        userInfo = {imageURI: user.imageURI, userID: user.userID.toString(), metroAreaDisplayName: user.metroAreaDisplayName, userDisplayName: user.userDisplayName, ratingCount: user.ratingCount}
        callback null, user, userInfo

exports.allUsersWithPermission = (permission, callback) -> #callback(err, users)
  User.find {permissions:permission},{}, (err, users) =>
    callback err, users

exports.allUsers = (callback) -> #callback(err, users)
  User.find {},{}, (err, users) =>
    callback err, users

exports.newUser = (displayName, permissions, telephoneNumber, callback) -> #callback(err, newUser)
  userProperties = {
    "displayName": displayName,
    "modifiedDate": new Date,
    "notificationInterval": 21600000,
    "overIntervalMessageAllowanceCount": 40,
    "permissions": permissions,
    "telephoneNumber":telephoneNumber,
    "token": genCode(20, displayName),
    "userID": genCode(10, displayName)
    }
  user = new User userProperties
  user.save (err) =>
    if err?
      console.log user, err
      callback "failed creating user w/ err #{err}"
    else
      callback null, user

exports.updateUserWithID = (userID, displayName, permissions, phoneNumber, callback) -> #callback(err, user)
  exports.getUserWithID userID, (err, user, info) =>
    if displayName?
      user.displayName = displayName
    if permissions?
      user.permissions = permissions
    
    numberChanged = false
    if phoneNumber?
      if user.telephoneNumber != phoneNumber
        user.telephoneNumber = phoneNumber
        numberChanged = true
    user.save (err) =>
      callback err, user

      if numberChanged
        message = "you're activated! Login with https://oh.domo.io/urllogin/#{user.token}"
        comsModel.processMessageToRecipientForSMS message, user.telephoneNumber, comsModel.sendSMS, (err, recp) =>
          console.log "sent sms to activator userID: #{userID} w/ err #{err}"
