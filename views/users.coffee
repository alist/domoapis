@title = 'users'


text '<div class="content container-fluid">'

userWrite = (user) ->
  li 'span6', ->
    div 'thumbnail', ->
      div 'caption', ->
        h5 'darkGreenLabel', -> "#{user.modifiedDate.toString()}"
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

form 'form-horizontal',id:'authCodeForm', method:'GET', action:"#", onsubmit: 'window.submitPressed.apply(); return false;', ->
  legend -> ''
  div 'row-fluid', ->
    div 'span4', id: 'usersNameSpan', ->
      div 'control-group', id: 'usersNameGroup', ->
        #p 'text-error hidden' , id:'badCodeWarning', -> 'whoops, bad code, try again'
        label 'control-label', for: "usersName", -> "User's name:"
        div 'controls', ->
          input 'span1', maxlength:'40', style:'height: 30px; width: 145px;', type:'text', id:'usersName', placeholder:'Enter users full name here', ->
             
      div 'span4', id: 'usersPhoneSpan', ->
        div 'control-group', id: 'usersPhoneGroup', ->
          #p 'text-error hidden' , id:'badCodeWarning', -> 'whoops, bad code, try again'
          label 'control-label', for: "usersPhone", -> "Phone number:"
          div 'controls', ->
            input 'span1', maxlength:'13', style:'height: 30px; width: 145px;', type:'text', id:'usersPhone', placeholder:'Enter a US phone number', ->
        div 'control-group', ->
          div 'controls', ->
            input 'btn btn-success', id:"submitButton", type: 'submit', -> 'Generate access URL'
            #p 'text-info hidden', id:'codeCountRemaining', -> 'Two trys left'

text '</ div>'
