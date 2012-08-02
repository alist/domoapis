@title = 'TourBus App'
@stylesheets = ['/css/style']

div '#indexHeader', ->
  a href: "/", ->
    img (id:"indexLogo",src:"/img/tourbusIndexLogo.png")
  div '#ratingsAppStorePrompt', ->
    a href:"http://itunes.com/app/tourbus", ->
      img (src:"/img/tourbusIndexAppStoreButton.png")



div '#ratingContainer', ->
  div '#ratingDisplay', ->
    div '#ratingArtistName', ->
      b "Two Door Cinema Club"
    div '#ratingConcertInfo', ->
      b "6/24/2012"
      text "House of Blues, Boston, MA"
    div '#ratingAndArtistTop', ->
      div '#artistImage', ->
      div '#ratingRatings', ->
        div '#ratingLine', ->
          b "overall rating"
          img (id: "ratingImage", class: "rating4", src: "/img/rating4.png")


div '#footerDisclaimer', ->
  a '#footerLink', href: '/', -> 'Home'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/faq', -> 'FAQ'
  p '#footerLink', -> ' | '
  a '#footerLink', href: '/contact', -> 'Contact Us'
  p '#allrightsFooter', -> '© 2012 TourBus LLC. All rights reserved.'
