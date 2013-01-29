@title = 'Rough Draft'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']

fbAppID = '8848577688'
body ->

text '<div class="content container-fluid">'

section id:'about', ->
  h1 ->
     text 'Welcome, Rough Draft! '
     small "We're glad to have you visit! Our goal is to create a humane experience that removes stigmatization around depression, and encourages support from friends and family. "
  p 'lead', -> 'We hope you see depression similarly as a concerning, yet confrontable problem and will join us in building human-centric solutions. '

  if @redirectURL? #if for example, index is rendered from offer/:id
    script "window.redirectURL = '#{@redirectURL}'"

  p ->
      a {class: "btn btn-primary btn-large",id:"writeUsButton", href:"mailto:alex@domo.io"}, -> 'Write us'
      ###
      if @localAuthor? == false
        text ' '
        a 'btn btn-primary btn-large', {href:"javascript:void(0)", onclick: 'window.loginPressed.apply()'}, -> 'Login'
      else
        text ' '
        a {class: "btn btn-primary btn-large", href:"/code"}, -> 'Enter Code'
      ###

section id: "references", ->
  div 'page-header', ->
    h1 ->
      small 'the following references may be helpful'
  div 'row', ->
    div 'span5 offset0', ->
      div 'media', ->
        div 'media-body', ->
          a href:'/roughdraft/ba-study.pdf', ->
            h4 'media-heading', -> 'Behavioral Activation Study'
          text 'Study that shows higher effectiveness of Behavioral Activation over other forms of depression treatment. '
    div 'span5 offset2', ->
       div 'media', ->
        div 'media-body', ->
          a href:'/roughdraft/presentation-slides.pdf', ->
            h4 'media-heading', -> 'Presentation Slides'
          text 'Presentation slides from Jan 28, 2013.'


text '</ div>'
