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



text '</ div>'
