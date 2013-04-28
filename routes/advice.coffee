adviceModel = require('../model/advice')

exports.form = (req, res) ->
  onReq = req.query.on
  @render advice: {adviceOn: onReq}

exports.form_post = (req, res) ->
  x_ip = req?.request?.headers?['x-forwarded-for']
  unless x_ip? then x_ip = req?.request?.connection?.remoteAddress
  adviceModel.addAdvice req.body.advice, req.body.adviceOn, req.body.adviceContact, {userIP: x_ip}, (err) =>
    if err?
      @send  {status: 'fail'}
    else
      @send  {status: 'success'}
