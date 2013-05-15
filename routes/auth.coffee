userModel = require '../model/user'
shorturlModel = require('../model/shorturl')

userLoginURLBase = "http://oh.domo.io/urllogin?token="

#will not return, if not permitted
exports.authCurrentUserForPermission = (req, res, permission, callback ) -> #callback(err, user)
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


exports.shortLoginURLForCurrentUser = (req, res) ->
  cookieToken = req.request?.cookies?.sessiontoken
  userModel.getAuthorWithToken cookieToken, (err, user) =>
    shortenURI = userLoginURLBase + cookieToken
    if user?
      shorturlModel.shorten shortenURI, 4, null, true, null, null, (err, shortURL) =>
        if err?
          console.log "shortening error #{err}"
        @send "short url code is http://oh.domo.io/x/#{shortURL.shortURICode}"
    else
      console.log "no user w. token #{cookieToken} w. err #{err}"
      @redirect '/supporters'

exports.urlLogin_get  = (req, res, callback) -> #callback(err, user)
  cookieToken = req.query.token #url.split(path.split('*')?[0])?[1]
  userModel.getAuthorWithToken cookieToken, (err, user) =>
    if user?
      req.response.cookie 'sessiontoken', cookieToken, {httpOnly: true,  maxAge: 90000000000 }
      @redirect '/giveadvice'
    else
      console.log "user corresponding to token doesnt exist in database w/ err #{err}"
      @redirect '/'
