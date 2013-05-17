secrets = require ('../secrets')

mongoose = require('mongoose')
Schema = mongoose.Schema

ObjectId = mongoose.SchemaTypes.ObjectId

#authors are users
UserSchema = new Schema {
  modifiedDate: {type: Date, index: {unique: false}}
  displayName: String
  imageURI: String
  userID: {type: String, required: true, index: {unique: true}}

  token: {type: String}
  facebookID: {type: Number, index: {unique: true}}
  
  isAdmin: {type: Boolean}
  permissions: [{type: String}]

  activeSessionIDs: [ {type: String, index: {unique: true}} ]
  telephoneNumber: {type: String, index: {unique: false}}
  telephoneVerifyDate: {type: Date}
  telephoneNumberVerifyAttemptCount: {type: Number}
  telelphoneVerifyCode: {type: String}
  messageCount: {type: Number}
  overIntervalMessageAllowanceCount: {type: Number}

  lastNotificationDate: {type: Date, index: {unique: false}}
  notificationInterval: {type: Number}
}

User = mongoose.model 'Author', UserSchema
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
  User.findOne {token: token},{}, (err, author) =>
    if err? || author? == false
        callback "no author found for token: #{token}"
    else
      callback null, author

exports.authCurrentUserWithIDAndTokenForSession = (userID, fbAToken, sessionToken, callback) -> #callback(err, author)
    if sessionToken? == false
      callback "no sessionToken included for userID author lookup"
      return
    
    #Strategy 1: find existing session
    User.findOne {activeSessionIDs: sessionToken},{}, (err, author) =>
      #console.log "found author w. ID #{author?.userID} for session #{sessionToken}"
      if err? || author? == false
        if userID? == false && fbAToken? == false
          #console.log "impossible to re-auth"
          callback "invalid session- and no re-auth route possible"
          return
        #strategy 2: query fb with fbAToken, then check for existing userIDs of equal to FB's response
        authUserWithFacebookOfIDAndToken userID, fbAToken, (err, fbUserID, fbResponse) =>
          if err? || ((fbUserID != userID) && userID? == true) ##if there is mismatch when userID!=nil
            callback "could not find author with pre-id #{userID} with fbID #{fbUserID} with error #{err}"
          else
            if userID? == false
              #if prior userID was unknown by request, we'll check to see if we have a match right now from FB
              console.log "using recursion to determine if fbUserID exists, now that we know it's #{fbUserID}"
              authCurrentUserWithIDAndTokenForSession fbUserID, fbAToken, sessionToken, callback
            else
              #we've authed the token using FB, and the userID probably exists
              imgURI = "https://graph.facebook.com/#{fbUserID}/picture?type=large&return_ssl_resources=1"
              authorInfo = {userID: fbUserID, facebookID: fbUserID, fbAccessToken: fbAToken, imageURI: imgURI, authorDisplayName: fbResponse.name, modifiedDate: new Date()}
              authorInfo.metroAreaDisplayName = fbResponse.location?.name
              
              console.log "create the author! with info #{authorInfo}"
              User.update {userID: fbUserID},{$set: authorInfo, $push: { activeSessionIDs: sessionToken}}, {upsert: 1}, (err) ->
                if err?
                  callback "error for author save #{err} with info #{authorInfo}"
                else
                  console.log "saved new author with info #{authorInfo}, using recursion for auth"
                  authCurrentUserWithIDAndTokenForSession fbUserID, fbAToken, sessionToken, callback
      else
        callback null, author

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

exports.getUserWithID = (userID, callback) -> #callback(err, author, abreviatedInfo)
    User.findOne {userID: userID},{fbAccessToken:0, facebookID: 0}, (err, author) =>
      if err? || author? == false
        callback "could not find author of id #{userID} with error #{err}"
      else
        authorInfo = {imageURI: author.imageURI, userID: author.userID.toString(), metroAreaDisplayName: author.metroAreaDisplayName, authorDisplayName: author.authorDisplayName, ratingCount: author.ratingCount}
        callback null, author, authorInfo

exports.allUsers = (callback) -> #callback(err, users)
  User.find {},{}, (err, authors) =>
    callback err, authors

exports.newUser = (displayName, permissions, callback) -> #callback(err, newUser)
  userProperties = {
    "displayName": displayName,
    "modifiedDate": new Date,
    "notificationInterval": 21600000,
    "overIntervalMessageAllowanceCount": 40,
    "permissions": permissions,
    "token": genCode(20, displayName),
    "userID": genCode(10, displayName)
  }
  user = new User userProperties
  user.save(err, user2) ->
    if err? || user2? == false
      callback "failed creating user w/ err #{err}"
    else
      callback null, user2

exports.updateUserWithID = (userID, displayName, phoneNumber, callback) ->#callback(err, user)
  exports.getUserWithID userID, (err, user, info) =>
    if displayName?
      user.displayName = displayName
    if phoneNumber?
      user.telephoneNumber = phoneNumber
    user.save(err) =>
      callback err, user
