if !@stylesheets
  @stylesheets = ['/css/bootstrap.min','/css/style']
if !@localScripts
  @localScripts = ['/js/jquery.min','/js/bootstrap']

head ->
  meta charset: 'utf-8'
  meta copyright: "ExoMachina, Inc. ExoMachina.com"
  meta name:"viewport", content:"width=device-width, initial-scale=1.0, user-scalable = no"
  meta name: "apple-mobile-web-app-capable", content:"yes"
  link rel:"icon", type:"image/png", href:"/icons/favicon.png"
  link rel:"apple-touch-icon", href:"/icons/touch-icon.png"
  #link href: "/css/bootstrap-responsive.css", rel: "stylesheet"
  
  title "#{@title or ''}#{if @title? then ' | ' else ''}Domo"

  if @stylesheets
    for s in @stylesheets
      link rel: 'stylesheet', href: s + '.css'
  link(rel: 'stylesheet', href: @stylesheet + '.css') if @stylesheet
  style @style if @style

  if @localScripts
    for s in @localScripts
        script src: s + '.js'


  if @hideToolbar != true
      body ->
          div 'header navbar-static-top', ->
            div 'container-fluid', ->
              a  {href: "/"}, ->
                img 'homeHeader', src: "/img/domo-website-header-logo.png", ->
      
              ///
              div 'headerControls hidden-desktop visible-phone',->
                div 'btn-group', ->
                  button 'btn btn-primary dropdown-toggle', 'data-toggle':'dropdown', href:'#', ->
                    text "! "
                    span 'caret', ->
                  ul 'dropdown-menu pull-right', ->
                    if @localAuthor? == true
                      li class:(if (this.parentView.name == 'code') then 'active' else ''), ->
                        a href:'/code', -> "Enter Code"
                      li class:(if (this.parentView.name == 'rewards') then 'active' else ''), ->
                        a href:'/rewards', -> "My Rewards"
                      li 'divider', ->
                    li ->
                      if @localAuthor? == false
                        a '', {href:"javascript:void(0)", onclick: 'window.loginPressed.apply()'}, -> 'Login'
                      else
                        a '', {href:"/logout"}, -> 'Logout'
      
              div 'headerControls hidden-phone', ->
                if @message?
                  div 'headerAlert', ->
                    text @message
                ul 'nav nav-pills inline', ->
                  li class:(if (this.parentView.name == 'code') then 'active' else ''), ->
                    a href:'/code', -> "Enter Code"
                  li class:(if (this.parentView.name == 'rewards') then 'active' else ''), ->
                    a href:'/rewards', -> "My Rewards"
                
                if @localAuthor? == false
                  a 'userLoginOutButton btn btn-primary btn-small', {href:"javascript:void(0)", onclick: 'window.loginPressed.apply()'}, -> 'Login'
                else
                  a 'userLoginOutButton btn btn-primary btn-small', {href:"/logout"}, -> 'Logout'
              ///
         
  @body

body ->
 footer ->
  a href:"mailto:domo@domo.io", -> "domo@domo.io"
  text ' | '
  a href:"/privacyandterms", -> "privacy&terms"
###
  br ->
  text ' by '
  a target:'_blank', href:'http://alist.im', -> 'Alex List'
  text ', '
  a target:'_blank', href:'http://hnk.im', -> 'Harish Kamath'
  text ' and the Domo team at MIT'
###

body ->
  if @scripts
    for s in @scripts
        script src: s + '.js'
  

#googlz analytiks lolz
script type:'text/javascript', ->
  text """
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-40851132-1', 'domo.io');
  ga('send', 'pageview');
       """
