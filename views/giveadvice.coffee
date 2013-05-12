@title = 'give advice'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']


text '<div class="content container-fluid">'

div 'page-header', ->
  h1 "Give advice"
ul 'thumbnails', ->
  for adviceRequest in @pendingAdvice
    li 'span6', ->
      div 'thumbnail alert-info', ->
        a href: "/giveadvice/#{adviceRequest._id.toString()}", ->
          div 'caption', ->
            h4 'text-info', -> "#{adviceRequest.modifiedDate.toString()}"
            h4 'text-info', -> "#{if adviceRequest.responses? then adviceRequest.responses?.length else 0} responses"
            h4 adviceRequest.advice
            #a 'btn btn-primary', href: reward.redeemURL, -> 'Redeem'
 

text '</ div>'
