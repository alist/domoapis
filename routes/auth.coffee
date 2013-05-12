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
