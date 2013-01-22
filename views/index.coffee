@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/jquery.min','/js/bootstrap']

fbAppID = '8848577688'
body ->

div 'contentHeader', ->
  div 'container-fluid', ->
    p 'contentHeaderText', -> "Above the stratosphere."

text '<div class="content container-fluid">'

#div 'hero-unit', ->
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
