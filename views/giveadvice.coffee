@title = 'give advice'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']


text '<div class="content container-fluid">'

div 'page-header', ->
  h1 "Give advice"
ul 'thumbnails row-fluid', ->
  for adviceRequest in @pendingAdvice
    li 'span6', ->
      div 'thumbnail alert-info', ->
        a href: "/giveadvice/#{adviceRequest._id.toString()}", ->
          div 'caption', ->
            h5 'text-info', -> "#{adviceRequest.modifiedDate.toString()}"
            h5 'text-info', -> "#{if adviceRequest.responses? then adviceRequest.responses?.length else 0} responses"
            h5 adviceRequest.advice
            #a 'btn btn-primary', href: reward.redeemURL, -> 'Redeem'
 

text '</ div>'
