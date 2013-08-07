
var errors = {}, errorMsgs = {};
errorMsgs['USERNAME_EXISTS'] = "Username already exists";
errorMsgs['INVALID_USERNAME_PASSWORD'] = "Invalid username or password";
errorMsgs['USER_NOT_FOUND'] = "Invalid user";
errorMsgs['SERVICE_NOT_FOUND'] = "Service not found";
errorMsgs['TOKEN_NOT_FOUND'] = "Token not found";
errorMsgs['TOKEN_INVALID'] = "Invalid token";
errorMsgs['TOKEN_EXPIRED'] = "Token expired";
errorMsgs['OP_FAIL'] = errorMsgs['DB_FAIL'] = "Couldn't complete operation. Please try again later";
errorMsgs['INVALID_ARG'] = "Invalid arguments supplied to function call";

errorMsgs['TOPIC_NOT_FOUND'] = "Invalid topic";
errorMsgs['TOPIC_USER_NOT_FOUND'] = "Invalid user";
errorMsgs['NOT_AUTHORISED'] = "Not authorised";

errorMsgs['ORG_NOT_FOUND'] = "Invalid organization";
errorMsgs['ROLE_EXISTS'] = "Role already exists";
errorMsgs['ROLE_NOT_FOUND'] = "Role not found for user";
errorMsgs['INVALID_ROLE'] = "Invalid role";


Object.keys(errorMsgs).forEach(function(err){
    errors[err] = function(d){
        var e = new Error(err);
        e.id = err;
        e.m = errorMsgs[err];
        e.d = d || '';
        e.toString = function(){
          return e.m;
        }
        return e;
    }
});


module.exports = {
  errors: errors
}