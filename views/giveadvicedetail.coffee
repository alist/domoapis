@title = 'give advice'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']


text '<div class="content container-fluid">'

div 'page-header', ->
  h1 "Give advice"
ul 'thumbnails', ->
  li 'span12 row-fluid media-row', ->
    div 'thumbnail alert-info', ->
      div 'caption', ->
        h4 'text-info', -> "#{@detailAdvice.modifiedDate.toString()}"
        h4 @detailAdvice.advice
          #a 'btn btn-primary', href: reward.redeemURL, -> 'Redeem'
  li 'span12 row-fluid', ->
    div 'thumbnail', style: 'padding: 14px;', ->
      h4 'text-success', -> @user.displayName
      textarea class: "input-block-level",  rows: "3", placeholder: "your response!", ->
      div class:'controls-row', ->
        label class: 'checkbox span6', ->
          input type: 'checkbox', ->
          text 'to the best of my ability, this adheres to the advice-giving guidlines'
        input 'btn btn-success span2', id:"submitButton", type: 'submit', style: 'float: right;', -> 'Submit'

text '</ div>'
