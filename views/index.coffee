@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']
@hideToolbar = true

fbAppID = '8848577688'
body ->
div 'contentHeader', ->
  div 'container-fluid', ->
    p 'contentHeaderText', -> ""
text '<div class="content container-fluid">'

section id:'about', ->
  h1 ->
     text 'Domo ' #hnk
     small 'brings people effective assistance for anxiety, depression, and other struggles they encounter in life.' #hnk
  br ->
  p 'lead', -> 'Get support from a wonderful movement - help with anxiety, depression, and other life struggles from an group of awesome and validated peers who care.' #hnk

  if @redirectURL? #if for example, index is rendered from offer/:id
    script "window.redirectURL = '#{@redirectURL}'"

  p ->
      a {class: "btn btn-primary btn-large btn-success",id:"getAdviceButton", href:"/getadvice"}, -> 'Get advice'

      a {class: "btn btn-primary btn-large btn-success",id:"giveAdviceButton", href:"mailto:domo@domo.io?subject=Applying%20to%20Give%20Advice"}, -> 'Give advice'


text '</ div>'
