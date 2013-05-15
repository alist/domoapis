@title = 'give advice'


text '<div class="content container-fluid">'

adviceRequestWrite = (adviceRequest) ->
  li 'span6', ->
    div 'thumbnail', ->
      a href: "/giveadvice/#{adviceRequest._id.toString()}", ->
        div 'caption', ->
          h5 'text-info', -> "#{adviceRequest.modifiedDate.toString()}"
          h5 'text-info', -> "#{if adviceRequest.responses? then adviceRequest.responses?.length else 0} responses"
          h5 adviceRequest.adviceRequest
          #a 'btn btn-primary', href: reward.redeemURL, -> 'Redeem'


div 'page-header', ->
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
