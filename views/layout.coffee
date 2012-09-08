  head ->
    meta charset: 'utf-8'
    meta name:"viewport", content:"width=960"
    meta name: "apple-mobile-web-app-capable", content:"yes"
    
    title "#{@title or 'Untitled'} | Offer"

    if @stylesheets
      for s in @stylesheets
        link rel: 'stylesheet', href: s + '.css'
    link(rel: 'stylesheet', href: @stylesheet + '.css') if @stylesheet
    style @style if @style
  
    if @localScripts
      for s in @localScripts
          script src: s + '.js'
 


  body ->
    div 'header navbar-static-top', ->
      div 'container', ->
        a  {href: "/"}, ->
          img 'homeHeader', src: "/img/adhearean-website-header-logo.png", ->
        if @localAuthor?
          a 'logoutButton', {href:"/logout"}, -> 'Logout'
    @body

  body ->
   footer ->
    text 'Adherean, Inc.'

  body ->
    if @scripts
      for s in @scripts
          script src: s + '.js'
    

