@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']

fbAppID = '8848577688'
body ->

div 'contentHeader', ->
  div 'container-fluid', ->
    p 'contentHeaderText', -> "Above the stratosphere."

text '<div class="content container-fluid">'

section id:'about', ->
  h1 ->
     text 'ExoMachina '
     small 'is a partnership-based development corporation'
  p 'lead', -> 'With partners having expertise in mental health, human-computer interaction and aerospace, ExoMachina combines research and design into products for the entire world.'

  if @redirectURL? #if for example, index is rendered from offer/:id
    script "window.redirectURL = '#{@redirectURL}'"

  p ->
      a {class: "btn btn-primary btn-large",id:"writeUsButton", href:"mailto:hello@exomachina.com"}, -> 'Write us'
      ###
      if @localAuthor? == false
        text ' '
        a 'btn btn-primary btn-large', {href:"javascript:void(0)", onclick: 'window.loginPressed.apply()'}, -> 'Login'
      else
        text ' '
        a {class: "btn btn-primary btn-large", href:"/code"}, -> 'Enter Code'
      ###

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
