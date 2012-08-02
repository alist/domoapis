@title = 'TourBus App'
@stylesheets = ['/css/style']

div '#indexHeader', ->
  a href: "/", ->
    img (id:"indexLogo",src:"/img/tourbusIndexLogo.png")

div '#ratingDisplay', ->

div '#footerDisclaimer', ->
  a '#footerLink', href: '/', -> 'Home'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/faq', -> 'FAQ'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/contact', -> 'Contact Us'
  p '#allrightsFooter', -> '© 2012 TourBus LLC. All rights reserved.'
