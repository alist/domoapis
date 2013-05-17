userModel = require '../model/user'
shorturlModel = require('../model/shorturl')


#will not return, if not permitted
exports.authCurrentUserForPermission = (req, res, permission, callback ) -> #callback(err, user)
  cookieToken = req.request?.cookies?.sessiontoken
  userModel.getUserWithToken cookieToken, (err, user) =>
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
  cookieToken = req.request?.cookies?.sessiontoken
  userModel.getUserWithToken cookieToken, (err, user) =>
    shortenURI = userModel.userLoginURLBase + cookieToken
    if user?
      shorturlModel.shorten shortenURI, 4, null, true, null, null, (err, shortURL) =>
        if err?
          console.log "shortening error #{err}"
        @send "short url code is https://oh.domo.io/x/#{shortURL.shortURICode}"
    else
      console.log "no user w. token #{cookieToken} w. err #{err}"
      @redirect '/supporters'

exports.urlLogin_get  = (req, res, callback) -> #callback(err, user)
  cookieToken = req.query.token #url.split(path.split('*')?[0])?[1]
  userModel.getUserWithToken cookieToken, (err, user) =>
    if user?
      req.response.cookie 'sessiontoken', cookieToken, {httpOnly: true,  maxAge: 90000000000 }
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
        @send {user: detailUser}
    else
      @redirect '/supporters'

#update user
exports.usersdetail_post = (req, res) ->
  userID = @params.id
  exports.authCurrentUserForPermission req, @response, 'supporter', (err, user) => #will not return, if not permitted
    if user.userID == userID || user.permissions.indexOf('admin') >= 0
      #authed
      telephoneNumber = req.body.telelphoneNumber
      displayName = req.body.displayName
      userModel.updateUserWithID userID, displayName, telephoneNumber, (err, detailUser) =>
        @send {user: detailUser}
    else
      @redirect '/supporters'

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
