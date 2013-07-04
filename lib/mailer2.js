var SendGrid = require(‘sendgrid’).SendGrid;


var sendgrid = new SendGrid(user, key);
sendgrid.send({
  to: ‘example@example.com’,
  from: ‘other@example.com’,
  subject: ‘Hello World’,
  text: ‘My first email through SendGrid’
}, function(success, message) {
  if (!success) {
    console.log(message);
  }
});

