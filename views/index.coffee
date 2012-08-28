@title = 'Welcome'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/bootstrap.min','/js/jquery.min']

h1 -> "what's up offer?"

coffeescript ->
  @window.loginPressed = (shouldLogin) ->
     FB.login (response) ->
      if response?
        console.log response, FB.getAccessToken()
        window.location = "/login?token=#{FB.getAccessToken()}"

if @user? == false
  a 'loginButton', {href:"javascript:void(0)", onclick: 'window.loginPressed.apply()'}, -> 'Login with Facebook'
else
  a 'loginButton', {href:"/logout"}, -> 'Logout'
