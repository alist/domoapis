adviceModel = require('../model/advice')
auth = require('../routes/auth') #middleware
crypto = require('crypto')

exports.giveadvice_post = (req, res) ->
  auth.authCurrentUserForPermission req, @response, 'supporter', (err, user) => #will not return, if not permitted
    if user?
      userDataToStore = {displayName: user.displayName, userID: user.userID}
      adviceModel.addResponse req.body.adviceRequestID, req.body.advice, userDataToStore, (err, newResponse) =>
        if err?
          console.log "failed with reason #{err}"
          @send  {status: 'fail'}
        else
          @send  {status: 'success', newResponse: newResponse}
    else
      @send {status: 'fail', reason: "not-authed"}

exports.advice_detail = (req, res) ->
  auth.authCurrentUserForPermission req, @response, 'supporter', (err, user) => #will not return, if not permitted
    adviceModel.getAdviceWithID @params.id, (err, advice) =>
      if advice?
        @render giveadvicedetail: {detailAdvice: advice, user: user}
      else @redirect '/giveadvice'

exports.approveAdviceRequest_get = (req, res) ->
  auth.authCurrentUserForPermission req, @response, 'admin', (err, user) => #will not return, if not permitted
    adviceRequestID = @params.id
    adviceModel.approveAdviceRequest adviceRequestID, (err) ->
      if err?
        console.log "err approving advice: #{err}"
        @send "didn't approve advicerequestID: #{adviceRequestID} w/ err: #{err}"
      else
        @send "approved advicerequestID: #{adviceRequestID}"

exports.advice_pending = (req, res) ->
  auth.authCurrentUserForPermission req, @response, 'supporter', (err, user) => #will not return, if not permitted
    adviceModel.getAdvice "pendingapproval", (err, pendingAdvice) =>
      @render giveadvice: {pendingAdvice: pendingAdvice, user: user}

exports.form = (req, res) ->
  onReq = req.query.on
  @render getadvice: {adviceOn: onReq}

#rename to getadvice_post
exports.getadvice_post = (req, res) ->
  x_ip = req?.request?.headers?['x-forwarded-for']
  unless x_ip? then x_ip = req?.request?.connection?.remoteAddress
  adviceModel.addAdvice req.body.adviceRequest, req.body.adviceContact, {userIP: x_ip}, (err, advice) =>
    if err? || advice? == false
      @send  {status: 'fail'}
    else
      adviceInfo = {accessToken: advice.accessToken, authToken: advice.authToken, status: advice.status}
      @send  {status: 'success', adviceInfo:adviceInfo}


#for advice-requestors

exports.adviceViewWithAdviceToken = (req, res) ->
  accessToken = @params.accessToken
  authToken = @query.authToken or @params.authToken #if query contains authToken, let's use it!
  
  if authToken?
    #pass back the advice if there's a match
    adviceModel.getAdviceWithAccessAndAuthTokens accessToken, authToken, (err, advice) =>
      if advice?
        @render adviceview: {accessToken: accessToken, advice:advice}
      else
        console.log "advice find err: #{err}"
        @render index: {err: 'advice not found'}
  else #authToken == 0
    #do NOT pass back the access token here
    adviceModel.getAdviceWithToken accessToken, (err, advice) =>
      if advice?
        @render adviceview: {accessToken: accessToken}
      else
        console.log "advice find err: #{err}"
        @render index: {err: 'advice not found'}

  

exports.getAdviceWithAdviceTokenAndPostedAuthToken = (req, res) ->
  accessToken = @params.accessToken
  authToken = req.body.authToken
  adviceModel.getAdviceWithAccessAndAuthTokens accessToken, authToken, (err, advice) =>
    if advice?
      @send {status: 'success', advice: advice}
    else
      console.log "advice authMatch fail for accessToken: #{accessToken} forAuthToken: #{authToken}"
      @send {status: 'bad'}

exports.postAdviceHelpfulWithAdviceTokenAndPostedAuthToken = (req, res) ->
  accessToken = @params.accessToken
  authToken = req.body.authToken
  adviceIndex = req.body.adviceIndex
  adviceModel.setAdviceHelpfulWithAccessAndAuthTokens accessToken, authToken, adviceIndex, (err, advice) =>
    if err? == false && advice?
      @send {status: 'success'}
    else
      console.log "couldn't set helpful on AT: #{accessToken} w/ err #{err}"
      @send {status: 'bad'}

