/* Constructor of Extension Delegate */
function ExtensionDelegate() {};
ExtensionDelegate.prototype.constructor = ExtensionDelegate;

/* Extension delegates definition */
ExtensionDelegate.prototype.extensionDidLoad = function(name){};
ExtensionDelegate.prototype.extensionDidUnload = function(name){};
ExtensionDelegate.prototype.extensionDidFailLoadWithError = function(name){};
ExtensionDelegate.prototype.extensionDidFailUnloadWithError = function(name){};
