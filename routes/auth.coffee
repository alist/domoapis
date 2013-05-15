userModel = require '../model/user'

#will not return, if not permitted
exports.authCurrentUserForPermission = (req, res, permission, callback ) -> #callback(err, user)
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
      @redirect '/'
    else
      console.log "user corresponding to token doesnt exist in database w/ err #{err}"
      @redirect '/'
