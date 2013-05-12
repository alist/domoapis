adviceModel = require('../model/advice')
auth = require('../routes/auth') #middleware

exports.advice_detail = (req, res) ->
  auth.authCurrentUserForPermission req, res, 'supporter', (err, user) =>
    adviceModel.getAdviceWithID @params.id, (err, advice) =>
      @render giveadvicedetail: {detailAdvice: advice, user: user}

exports.advice_pending = (req, res) ->
  auth.authCurrentUserForPermission req, res, 'supporter', (err, user) =>
    adviceModel.getAdvice "pendingapproval", (err, pendingAdvice) =>
      @render giveadvice: {pendingAdvice: pendingAdvice, user: user}

exports.form = (req, res) ->
  onReq = req.query.on
  @render getadvice: {adviceOn: onReq}

exports.form_post = (req, res) ->
  x_ip = req?.request?.headers?['x-forwarded-for']
  unless x_ip? then x_ip = req?.request?.connection?.remoteAddress
  adviceModel.addAdvice req.body.advice, req.body.adviceOn, req.body.adviceContact, {userIP: x_ip}, (err) =>
    if err?
      @send  {status: 'fail'}
    else
      @send  {status: 'success'}
