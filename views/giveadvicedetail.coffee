@title = 'give advice'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']


text '<div class="content container-fluid">'

div 'page-header', ->
  h1 "Give advice"
ul 'thumbnails', ->
  li 'span12', ->
    div 'thumbnail alert-info', ->
      a href: "/giveadvice/#{@detailAdvice._id.toString()}", ->
        div 'caption', ->
          h4 'text-info', -> "#{@detailAdvice.modifiedDate.toString()}"
          h4 'text-info', -> "#{if @detailAdvice.responses? then @detailAdvice.responses?.length else 0} responses"
          h4 @detailAdvice.advice
            #a 'btn btn-primary', href: reward.redeemURL, -> 'Redeem'
 

text '</ div>'
