exports.mongoDBConnectURLSecret = 'mongodb://domomain:CvB8KBKd3qH9db@dbh62.mongolab.com:27627/heroku_app15761281' #hnk06/25/13 staging 

exports.primaryHost = "domo-io-staging.herokuapp.com" #hnk06/25/13 staging 

exports.sessionSecret = 'dasds21dkds22as2jsjsad%'

exports.twilioAccountSid = 'AC69269a4e08b2f7388a87bb1ba11c6c60'
exports.twilioAuthToken = 'e6b7b46dae6519e0f453e1df6f6c3946'
exports.twilioAppToken = 'AP27f9fc11c73b07373582c10f8cc2cffc'

exports.userTypes = ["supportee", "supporter", "adopter", "moduleadmin", "admin"]

exports.mailConfig =
  host: "smtp.sendgrid.net"
  port: 587
  secureConnection: false
  auth:
    user: "domo@domo.io"
    pass: "d0m0 is c##l"
  from: "\"Domo \" <domo@domo.io>"
  adminEmails: [ 'alex@domo.io', 'harish@domo.io' ]
  
###exports.SendGridConfig = 
    user: 'domo@domo.io'
    key: 'd0m0 is c##l'
    optionalParams:
      smtpapi: new SmtpapiHeaders()###     
#hnk07/09/13 refactor+{  
exports.config = env:
  port: 8080  
 

    
    


  
  
  
  

  