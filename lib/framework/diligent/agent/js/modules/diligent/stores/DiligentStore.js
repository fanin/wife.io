var DiligentDispatcher = require('../dispatcher/DiligentDispatcher');
var DiligentConstants  = require('../constants/DiligentConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');

var DiligentClient = null;

var DiligentStore = assign({}, EventEmitter.prototype, {
    getClient: function() {
        return DiligentClient;
    },

    emitDiligentChange: function(args) {
        this.emit('DILIGENT_CHANGE_EVENT', args);
    },

    addDiligentChangeListener: function(callback) {
        this.on('DILIGENT_CHANGE_EVENT', callback);
    },

    removeDiligentChangeListener: function(callback) {
        this.removeListener('DILIGENT_CHANGE_EVENT', callback);
    }
});

DiligentStore.dispatchToken = DiligentDispatcher.register(function(action) {
    switch(action.actionType) {
        case DiligentConstants.DILIGENT_CLIENT_INITIATE:
            DiligentClient = action.client;
            break;
    }

    DiligentStore.emitDiligentChange({ actionType: action.actionType });
});

module.exports = DiligentStore;
