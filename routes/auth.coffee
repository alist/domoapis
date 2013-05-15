userModel = require '../model/user'

#will not return, if not permitted
exports.authCurrentUserForPermission = (req, res, permission, callback ) -> #callback(err, user)
  console.log res, req
  cookieToken = req.request?.cookies?.sessiontoken
  userModel.getAuthorWithToken cookieToken, (err, user) =>
    if user?
      permissions = user.permissions
      if (permissions.indexOf(permission) >= 0)
        callback null, user
      else
        console.log "userID: #{user.userID} w. permissions: #{permissions} does not have permission: #{permission}"
        res.redirect '/supporters'
    else
      res.redirect '/supporters'

  ###userModel.authToken token, (user) =>
    if user? == false
      #set redir url
      res.redirect '/login'
    else 
      if user.permissions.contains permission
        callback null, user
      else
        res.render '/', {err: 'not authorized'}
  ###
  testUser = {displayName: "Alexander List", userID: "100000103231001"}
  callback null, testUser


exports.urlLogin_get  = (req, res, callback) -> #callback(err, user)
  cookieToken = req.query.token #url.split(path.split('*')?[0])?[1]
  userModel.getAuthorWithToken cookieToken, (err, user) =>
    if user?
      req.response.cookie 'sessiontoken', cookieToken, {httpOnly: true,  maxAge: 90000000000 }
      @redirect '/giveadvice'
    else
      console.log "user corresponding to token doesnt exist in database w/ err #{err}"
      @redirect '/'
