var $TEMPLATE$Dispatcher   = require('../dispatcher/$TEMPLATE$Dispatcher');
var $TEMPLATE$Constants    = require('../constants/$TEMPLATE$Constants');
var DiligentActionCreators = DiligentAgent.actions;

var $TEMPLATE$ActionCreators = {
    /**
     * Register event listeners for diligent clients
     */
    register: function() {

    },

    /**
     * Unregister diligent client event listeners
     */
    unregister: function() {

    }

    /**
     * Extension support
     */
    /* Uncomment this to support loading extension
    loadExtension: function() {
        DiligentActionCreators.loadExtension(YOUR_EXTENSION);
    },
    */

    /* Uncomment this to support unloading extension
    unloadExtension: function() {
        DiligentActionCreators.unloadExtension(YOUR_EXTENSION);
    }
    */
}

module.exports = $TEMPLATE$ActionCreators;
