@title = 'TourBus App'
@stylesheets = ['/css/style']

div '#header', ->
  img (id:"indexLogo",src:"/img/tourbusIndexLogo.png")


div '#center', ->
  div '#centerContent', ->
    div '#indexAppDemo', ->
    div '#description', ->
    div '#appStore', ->
      a href:"http://itunes.com/app/tourbus", ->
        img (src:"/img/tourbusIndexAppStoreButton.png")

div '#footerDisclaimer', ->
  a '#footerlink', href: '/faq', -> 'FAQ'
  text ' | '
  a '#footerlink', href: '/contact', -> 'Contact Us'
  p '#allrightsFooter', -> '© 2012 TourBus LLC. All rights reserved.'
