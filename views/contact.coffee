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
    div '#contactUsHeader', ->
    div '#infoText', ->
      b "Feedback"
      p ->
        text "We’d love to hear what you have to think about TourBus. <br />"
        text "For all feedback, please contact us at "
        a href: 'mailto:feedback@tourb.us', -> 'feedback@tourb.us'
      
      b 'Technical Support'
      p ->
        text "For any technical issues, please contact us at "
        a href: 'mailto:support@tourb.us', -> 'support@tourb.us'
      
      b 'Press'
      p ->
        text "For all media inquiries, please contact us at "
        a href: 'mailto:press@tourb.us', -> 'support@tourb.us'
     
    div '#stdAllrightsFooter', ->
      b '©'
      text ' 2012 TourBus LLC. All rights reserved.'
