@title = 'give advice'


text '<div class="content container-fluid">'

adviceRequestWrite = (adviceRequest) ->
  adviceRequestID = adviceRequest?._id.toString()
  li 'span6', ->
    div 'thumbnail', ->
      div 'caption', ->
        if adviceRequest?.status != "PRES" && @user?.permissions?.indexOf("admin") >= 0
          a href:"/approve/#{adviceRequestID}", -> "approve me"
          a class:'right grayLabel', href:"/flag/#{adviceRequestID}", -> "reject me"
        a href: "/giveadvice/#{adviceRequest._id.toString()}", ->
          h5 'darkGreenLabel', -> "#{adviceRequest.modifiedDate.toString()}"
          h5 'darkGreenLabel', -> "#{if adviceRequest.responses? then adviceRequest.responses?.length else 0} responses"
          p 'giveAdviceAdviceRequest', -> adviceRequest.adviceRequest
          #a 'btn btn-primary', href: reward.redeemURL, -> 'Redeem'


div 'page-header', ->
  a href: '/giveadvice', ->
    h1 "Give advice"
if @pendingAdvice?.length > 0 then for i in [0 .. @pendingAdvice?.length-1]
  if i % 2 != 0
    continue
  adviceRequest0 = @pendingAdvice[i]
  adviceRequest1 = @pendingAdvice[i+1]
  div 'row-fluid', ->
    ul 'thumbnails', ->
      adviceRequestWrite adviceRequest0
      if adviceRequest1?
        adviceRequestWrite adviceRequest1

text '</ div>'
