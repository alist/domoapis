userModel = require '../model/user'
shorturlModel = require('../model/shorturl')


#will not return, if not permitted
exports.authCurrentUserForPermission = (req, res, permission, callback ) -> #callback(err, user)
  tokenForCookie = req.request?.cookies?.sessiontoken
  userModel.getUserWithToken tokenForCookie, (err, user) =>
    if user?
      permissions = user.permissions
      if (permissions.indexOf(permission) >= 0)
        callback null, user
      else
        console.log "userID: #{user.userID} w. permissions: #{permissions} does not have permission: #{permission}"
        res.redirect '/supporters'
    else
      res.redirect '/supporters'


exports.shortLoginURLForCurrentUser = (req, res) ->
  tokenForCookie = req.request?.cookies?.sessiontoken
  userModel.getUserWithToken tokenForCookie, (err, user) =>
    shortenURI = userModel.userLoginURLBase + tokenForCookie
    if user?
      shorturlModel.shorten shortenURI, 4, null, true, null, null, (err, shortURL) =>
        if err?
          console.log "shortening error #{err}"
        @send "short url code is https://oh.domo.io/x/#{shortURL.shortURICode}"
    else
      console.log "no user w. token #{tokenForCookie} w. err #{err}"
      @redirect '/supporters'

exports.urlLogin_get  = (req, res, callback) -> #callback(err, user)
  tokenForCookie = @params?.token
  if tokenForCookie? == false
    tokenForCookie = req.query.token
  
  userModel.getUserWithToken tokenForCookie, (err, user) =>
    if user?
      req.response.cookie 'sessiontoken', tokenForCookie, {path:'/', httpOnly: true,  maxAge: 90000000000 }
      @redirect '/giveadvice'
    else
      console.log "user corresponding to token doesnt exist in database w/ err #{err}"
      @redirect '/'

exports.userslist_get = (req, res) ->
  exports.authCurrentUserForPermission req, @response, 'admin', (err, user) => #will not return, if not permitted
    userModel.allUsers (err, users) =>
      @render users:{users: users}

exports.usersdetail_get = (req, res) ->
  userID = @params.id
  exports.authCurrentUserForPermission req, @response, 'supporter', (err, user) => #will not return, if not permitted
    if user.userID == userID || user.permissions.indexOf('admin') >= 0
      #authed
      userModel.getUserWithID userID, (err, detailUser, info) =>
        @render usersdetail:{user: detailUser}
    else
      @redirect '/supporters'

#update user
exports.usersdetail_post = (req, res) ->
  userID = @params.id
  exports.authCurrentUserForPermission req, @response, 'supporter', (err, user) => #will not return, if not permitted
    if user.userID == userID || user.permissions.indexOf('admin') >= 0
      #authed
      telephoneNumber = req.body.telephoneNumber
      displayName = req.body.displayName
      permissions = req.body.permissions
      userModel.updateUserWithID userID, displayName, permissions, telephoneNumber, (err, detailUser) =>
        @send {status:'success', user: detailUser}
    else
      @send {status: "bad"}

#new user!
exports.users_post = (req, res) ->
  exports.authCurrentUserForPermission req, @response, 'admin', (err, user) => #will not return, if not permitted
    console.log req.body
    displayName = req.body.displayName
    permissions = req.body.permissions
    telephoneNumber = req.body.telephoneNumber
    userModel.newUser displayName, permissions, telephoneNumber, (err, newUser) =>
      if err? || newUser? == false
        @send {status: "bad"}
      else
        @send {status:'success',newUser: newUser}
