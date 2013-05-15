adviceModel = require('../model/advice')
auth = require('../routes/auth') #middleware

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
  adviceModel.addAdvice req.body.adviceRequest, req.body.adviceContact, {userIP: x_ip}, (err) =>
    if err?
      @send  {status: 'fail'}
    else
      @send  {status: 'success'}
