/* Constructor of Socket.IO Connection Delegate */
function ConnectionDelegate() {};
ConnectionDelegate.prototype.constructor = ConnectionDelegate;

/* Connection delegates definition */
ConnectionDelegate.prototype.connectionDidEstablish = function(){};
ConnectionDelegate.prototype.connectionDidClose = function(){};
ConnectionDelegate.prototype.connectionDidFailWithError = function(error){};
