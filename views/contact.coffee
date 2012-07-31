@title = 'TourBus App | Contact Us'
@stylesheets = ['/css/style']

div '#stdHeader', ->
  div '#stdHeaderContent', ->
    a href: "/", ->
      img (id:"stdLogo",src:"/img/tourbusStdHeaderLogo.png")
    div '#headerLinks', ->
      a '#headerLink', href: '/', -> 'Home'
      p '#headerLink',  class:'headerSeperator', -> '|'
      a '#headerLink', href: '/faq', -> 'FAQ'
      p '#headerLink',  class:'headerSeperator', -> '|'
      a '#headerLink', class:'currentHeaderLink', href: '/contact', -> 'Contact Us'

div '#contentBox', ->
  div '#content', ->
    div '#faqInfoText', ->
    div '#stdAllrightsFooter', -> '© 2012 TourBus LLC. All rights reserved.'
