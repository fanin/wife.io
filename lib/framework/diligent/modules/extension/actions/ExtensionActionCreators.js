var ExtensionDispatcher = require('../dispatcher/ExtensionDispatcher');
var ExtensionConstants  = require('../constants/ExtensionConstants');

var ExtensionActionCreators = {
    load: function(module) {
        ExtensionDispatcher.dispatch({
            actionType: ExtensionConstants.EXTENSION_LOAD,
            name: module.name,
            version: module.version
        });

        DiligentAgent.getClient().extensionManager.load(module, function(name, version, error) {
            if (!error) {
                ExtensionDispatcher.dispatch({
                    actionType: ExtensionConstants.EXTENSION_LOAD_SUCCESS,
                    name: name,
                    version: version
                });
            }
            else {
                ExtensionDispatcher.dispatch({
                    actionType: ExtensionConstants.EXTENSION_LOAD_FAIL,
                    name: name,
                    error: error
                });
            }
        });
    },

    unload: function(module) {
        ExtensionDispatcher.dispatch({
            actionType: ExtensionConstants.EXTENSION_UNLOAD,
            name: module.name,
            version: module.version
        });

        DiligentAgent.getClient().extensionManager.unload(module, function(name, version, error) {
            if (!error) {
                ExtensionDispatcher.dispatch({
                    actionType: ExtensionConstants.EXTENSION_UNLOAD_SUCCESS,
                    name: name,
                    version: version
                });
            }
            else {
                ExtensionDispatcher.dispatch({
                    actionType: ExtensionConstants.EXTENSION_UNLOAD_FAIL,
                    name: name,
                    error: error
                });
            }
        });
    }
}

module.exports = ExtensionActionCreators;
