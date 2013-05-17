@title = 'users'


coffeescript ->
  @window.submitPressed = () ->
    errorAction = () ->
      $("#submitButton").removeClass('disabled')
      $('#submitStatus').removeClass('hidden')
      $('#submitStatus').text 'server-error!'

    displayName = $('#displayNameInput').val()
    phoneNumber = $('#phoneNumberInput').val()
    permissions = JSON.parse($('#permissionsInput').val())
    $.post("/users", {displayName: displayName, telephoneNumber:phoneNumber,permissions:permissions}, (response)=>
      console.log response
      if response?.status != "success" || response?.newUser? == false
        errorAction()
      else
        window.location = '/users'
    ).error(errorAction)

text '<div class="content container-fluid">'

userWrite = (user) ->
  li 'span6', ->
    div 'thumbnail', ->
      div 'caption', ->
        a href: "/users/#{user.userID}", ->
          h5 'darkGreenLabel', -> "#{user.permissions.toString()}"
          h5 'darkGreenLabel', -> "#{user.displayName}"
          h5 'darkGreenLabel', -> "tel: #{user.telephoneNumber}"
          h5 'darkGreenLabel', -> "id: #{user.userID}"
        loginURL = "https://oh.domo.io/urllogin?token=#{user.token}"
        a href: loginURL, -> "oh.domo.io/urllogin?toke..."


div 'page-header', ->
  h1 "Give advice"
if @users?.length > 0 then for i in [0 .. @users?.length-1]
  if i % 2 != 0
    continue
  user0 = @users[i]
  user1 = @users[i+1]
  div 'row-fluid', ->
    ul 'thumbnails', ->
      userWrite user0
      if user1?
        userWrite user1

form 'form-horizontal',id:'newUserForm', method:'GET', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
  legend -> 'New user'
  div 'span4 row-fluid', id: 'usersNameSpan', ->
    div 'control-group', id: 'displayNameGroup', ->
      label 'control-label', for: "displayNameInput", -> "Display Name:"
      div 'controls', ->
        input 'span1', style:'height: 30px; width: 200px;', type:'text', id:'displayNameInput', placeholder:'Display name', ->
    div 'control-group', id: 'phoneNumberGroup', ->
      label 'control-label', for: "phoneNumberInput", -> "Phone number:"
      div 'controls', ->
        input 'span1', maxlength:'10', style:'height: 30px; width: 200px;', type:'text', id:'phoneNumberInput', placeholder:'3213214567', ->

    div 'control-group', id: 'permissionsGroup', ->
      p 'text-error hidden' , id:'badPermissionsGroupLabel', -> 'whoops, bad permissions, try again'
      label 'control-label', for: "permissionsInput", -> "Permissions:"
      div 'controls', ->
        input 'span1', style:'height: 30px; width: 200px;', type:'text', id:'permissionsInput', placeholder:"[&quot;admin&quot;, &quot;supporter&quot;]", value:"[&quot;supporter&quot;]", ->
    div 'control-group', ->
      div 'controls', ->
        input 'btn btn-success', id:"submitButton", type: 'submit', -> 'Generate access URL'

text '</ div>'
