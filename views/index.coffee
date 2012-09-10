@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']

fbAppID = '488045857873688'
body ->

div 'contentHeader', ->
  div 'container-fluid', ->
    p 'contentHeaderText', -> "Your health can be rewarding."

text '<div class="content container-fluid">'

#div 'hero-unit', ->
h1 ->
   text 'Adherean '
   small 'is currently in a pilot development phase'
p 'lead', -> 'Adherean helps patients stay on track with their treatment plans. Our Healthcheck technology turns simple medication checkups into secret codes patients can exchange for instant rewards.'

if @redirectURL? #if for example, index is rendered from offer/:id
  script "window.redirectURL = '#{@redirectURL}'"

coffeescript ->
  @window.loginPressed = (shouldLogin) ->
     FB.login (response) ->
      if response?
        #here we see whether we redirect
        if window.redirectURL then redirectStr = "&redirectURL=#{window.redirectURL}" else redirectStr =""
        window.location = "/login?token=#{FB.getAccessToken() + redirectStr}"

if @message
  p 'message', -> @message
 
p ->
    a {class: "btn btn-primary btn-large", href:"mailto:info@adherean.com"}, -> 'Stay In Touch'
    if @localAuthor? == false
      text ' '
      a 'btn btn-primary btn-large', {href:"javascript:void(0)", onclick: 'window.loginPressed.apply()'}, -> 'Login'
    
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


text '</ div>'
