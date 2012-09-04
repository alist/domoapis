@title = 'Ask Friends'
@stylesheets = ['/css/style','/css/bootstrap.min']
@localScripts = ['/js/bootstrap.min','/js/jquery.min']

p ->
  span 'help-inline', ->
    'These friends have agreed to help with anything you need. They care about what you say, so ask away.'

console.log @localAuthor

if @localAuthor?.offerGroups? then for offerGroup in @localAuthor.offerGroups
  h3 offerGroup.groupDisplayName
  table 'table', {id: 'friendTable'}, ->
    th 'Person'
    th 'Remove'
    if offerGroup.subscribers? then for subscriber in offerGroup.subscribers
      tr ->
        td ->
          div 'friendImage', {style:"background-image: url('#{subscriber.imageURI}')"}, ->
          text subscriber.authorDisplayName
        td ->
          a 'btn', {href:"/friends/#{offerGroup._id}/#{subscriber.authorID}/remove"}, -> 'X'


