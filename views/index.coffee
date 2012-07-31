@title = 'TourBus App'
@stylesheets = ['/css/style']

div '#indexHeader', ->
  a href: "/", ->
    img (id:"indexLogo",src:"/img/tourbusIndexLogo.png")


div '#indexCenter', ->
  div '#centerContent', ->
    div '#indexAppDemo', ->
    div '#description', ->
    div '#appStore', ->
      a href:"http://itunes.com/app/tourbus", ->
        img (src:"/img/tourbusIndexAppStoreButton.png")

div '#footerDisclaimer', ->
  a '#footerLink', href: '/faq', -> 'FAQ'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/contact', -> 'Contact Us'
  p '#allrightsFooter', -> '© 2012 TourBus LLC. All rights reserved.'
