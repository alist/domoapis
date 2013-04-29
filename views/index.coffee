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
  p 'lead', -> 'You are about to become part of a wonderful movement - help with anxiety, depression, and other life struggles from an group of awesome and certified people who care.' #hnk

  if @redirectURL? #if for example, index is rendered from offer/:id
    script "window.redirectURL = '#{@redirectURL}'"

  p ->
      a {class: "btn btn-primary btn-large btn-success",id:"getAdviceButton", href:"/advice/"}, -> 'Get advice'

      a {class: "btn btn-primary btn-large btn-success",id:"giveAdviceButton", href:"mailto:domo@domo.io?subject=Applying%20to%20Give%20Advice"}, -> 'Give advice'
      ###
      if @localAuthor? == false
        text ' '
        a 'btn btn-primary btn-large', {href:"javascript:void(0)", onclick: 'window.loginPressed.apply()'}, -> 'Login'
      else
        text ' '
        a {class: "btn btn-primary btn-large", href:"/code"}, -> 'Enter Code'
      ###
### #hnk042813-{
section id: "apps", ->
  div 'page-header', ->
    h1 ->
      small 'launched products include'
  div 'row', ->
    div 'span5 offset1', ->
      div 'media', ->
        a 'pull-left', href:'/fibromyalgia', ->
          img 'media-object', src: "/img/app-icons/100x100/fibromyalgia.png", ->
        div 'media-body', ->
          a href:'/fibromyalgia', ->
            h4 'media-heading', -> 'Fibromyalgia'
          text 'the Fibromyalgia app helps people track their pain-levels over time with the research-validated FIQR.'
    div 'span5 offset1', ->
       div 'media', ->
        a 'pull-left', href:'/exonotes', ->
          img 'media-object', src: "/img/app-icons/100x100/exonotes.png", ->
        div 'media-body', ->
          a href:'/exonotes', ->
            h4 'media-heading', -> 'exoNotes'
          text 'exoNotes brings easy-to-use text and drawing functionality to your fingers within a smart interface.'



text '</ div>'
### #hnk042813-}
