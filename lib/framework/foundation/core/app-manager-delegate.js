/* Constructor of App Manager Delegate */
function AppManagerDelegate() {};
AppManagerDelegate.prototype.constructor = AppManagerDelegate;

/* App Manager delegates definition */
AppManagerDelegate.prototype.appIsUploading = function(installationCode){};
AppManagerDelegate.prototype.appIsInstalling = function(installationCode){};
AppManagerDelegate.prototype.appDidInstall = function(installationCode){};
AppManagerDelegate.prototype.appDidCancelInstall = function(installationCode){};
AppManagerDelegate.prototype.appDidUninstall = function(appInfo){};
AppManagerDelegate.prototype.appDidFailInstallWithError = function(error){};
AppManagerDelegate.prototype.appDidFailUninstallWithError = function(error){};
