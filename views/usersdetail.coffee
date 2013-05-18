@title = 'user'

userID = @user?.userID?.toString()
script type:'text/javascript', ->
  text "userID = #{JSON.stringify(userID)};"


coffeescript ->
  @window.submitPressed = () ->
    $('#submitButton').addClass('disabled')
    
    errorAction = () ->
      $("#submitButton").removeClass('disabled')
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text 'server-error!'

    displayName = $('#displayNameInput').val()
    phoneNumber = $('#phoneNumberInput').val()
    permissions = JSON.parse($('#permissionsInput').val())
    $.post("/users/#{userID}", {displayName: displayName, telephoneNumber:phoneNumber,permissions:permissions}, (response)=>
      console.log response
      if response?.status != "success" || response?.user? == false
        errorAction()
      else
        $('#submitSuccess').removeClass('hidden')
        $('#submitStatus').addClass('hidden')
    ).error(errorAction)

text '<div class="content container-fluid">'

userWrite = (user) ->
  li 'span6', ->
    div 'thumbnail userInfoBox', ->
      div 'caption', ->
        a href: "/users/#{user.userID}", ->
          h5 'darkGreenLabel', -> "#{user.permissions.toString()}"
          h5 'darkGreenLabel', -> "#{user.displayName}"
          h5 'darkGreenLabel', -> "tel: #{user.telephoneNumber}"
          h5 'darkGreenLabel', -> "id: #{user.userID}"
        loginURL = "https://oh.domo.io/urllogin/#{user.token}"
        a href: loginURL, -> "oh.domo.io/urllogin/#{user.token}"


div 'page-header', ->
  h1 "User info"
  div 'row-fluid', ->
    ul 'thumbnails', ->
      userWrite @user
      a class: "btn btn-primary btn-large btn-success right", href:'/giveadvice', -> "Give Advice Now"

form 'form-horizontal',id:'newUserForm', method:'GET', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
  legend -> 'notification phone # for active account'
  p 'text-success ', -> "When you enter your phone number, we'll start sending you SMS-notifications when requests are available to answer"
  h4 'text-warning hidden', id:'submitStatus', -> "Whoops, an error occured. :( email domo@domo.io if it keeps up!"
  h4 'text-success hidden', id:'submitSuccess', -> "Activated! We sent you an sms if you added your #!!"
  div 'span3 row-fluid', id: 'usersNameSpan', ->
    div 'control-group', id: 'displayNameGroup', ->
      label 'control-label', for: "displayNameInput", -> "Display Name:"
      div 'controls', ->
        input 'span1', style:'height: 30px; width: 110px;', type:'text', id:'displayNameInput', placeholder:'Display name',value: @user.displayName, ->
    div 'control-group', id: 'phoneNumberGroup', ->
      label 'control-label', for: "phoneNumberInput", -> "Phone number:"
      div 'controls', ->
        input 'span1', maxlength:'10', style:'height: 30px; width: 110px;', type:'text', id:'phoneNumberInput', placeholder:'3213214567',value:@user.telephoneNumber, ->
    div 'control-group', id: 'permissionsGroup', ->
      p 'text-error hidden' , id:'badPermissionsGroupLabel', -> 'whoops, bad permissions, try again'
      label 'control-label', for: "permissionsInput", -> "Permissions:"
      div 'controls', ->
        input 'span2', style:'height: 30px; width: 110px;', type:'text', id:'permissionsInput', placeholder:"[&quot;admin&quot;, &quot;supporter&quot;]", value:JSON.stringify(@user.permissions).replace(/\"/g,"&quot;"), ->
    div 'control-group', ->
      div 'controls', ->
        input 'btn btn-success', id:"submitButton", type: 'submit', -> 'Generate access URL'

text '</ div>'
