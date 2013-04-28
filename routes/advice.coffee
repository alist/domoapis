adviceModel = require('../model/advice')

exports.form = (req, res) ->
  onReq = req.query.on
  @render advice: {adviceOn: onReq}

exports.form_post = (req, res) ->
  x_ip = req?.request?.headers?['x-forwarded-for']
  unless x_ip? then x_ip = req?.request?.connection?.remoteAddress
  adviceModel.addFeedback req.body.advice, req.body.adviceOn, {userIP: x_ip}, (err) =>
    if err?
      @send  {status: 'fail'}
    else
      @send  {status: 'success'}
