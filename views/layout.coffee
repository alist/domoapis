  head ->
    meta charset: 'utf-8'
    meta name:"viewport", content:"width=870"
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
 
  fbAppID = '410538195679889'
  debug = 1

  body ->
    text """
    <div id="fb-root"></div>
    <script>
      window.fbAsyncInit = function() {
        FB.init({
        appId      : '#{fbAppID}', // App ID
              channelUrl : 'http://offer.herokuapp.com/channel.html', // Channel File
              status     : true, // check login status
              cookie     : true, // enable cookies to allow the server to access the session
              xfbml      : true  // parse XFBML
              });
    // Additional initialization code here
      };

        // Load the SDK Asynchronously
          (function(d){
                 var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
                      if (d.getElementById(id)) {return;}
                           js = d.createElement('script'); js.id = id; js.async = true;
                                js.src = "//connect.facebook.net/en_US/all.js";
                                     ref.parentNode.insertBefore(js, ref);
                                        }(document));
          </script>
    """


  body ->
    @body
   
  body ->
    if @scripts
      for s in @scripts
          script src: s + '.js'
    
  footer ->
    text 'Exomachina, Inc.'
