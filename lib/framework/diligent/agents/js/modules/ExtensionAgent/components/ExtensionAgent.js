'use strict';

var assign                  = require('object-assign');
var EventEmitter            = require('events').EventEmitter;
var ExtensionActionCreators = require('../actions/ExtensionActionCreators');
var ExtensionConstants      = require('../constants/ExtensionConstants');
var ExtensionStore          = require('../stores/ExtensionStore');

var ExtensionAgent = assign({}, EventEmitter.prototype, {
    init: function() {
        ExtensionStore.addChangeListener(this._onExtensionChange);
    },

    deinit: function() {
        ExtensionStore.removeChangeListener(this._onExtensionChange);
    },

    _onExtensionChange: function(args) {
        switch (args.actionType) {
            case ExtensionConstants.EXTENSION_LOAD:
                ExtensionAgent.emit('extension.willLoad', args.name);
                break;
            case ExtensionConstants.EXTENSION_UNLOAD:
                ExtensionAgent.emit('extension.willUnload', args.name);
                break;
            case ExtensionConstants.EXTENSION_LOAD_SUCCESS:
                ExtensionAgent.emit('extension.didLoad', args.name);
                break;
            case ExtensionConstants.EXTENSION_UNLOAD_SUCCESS:
                ExtensionAgent.emit('extension.didUnload', args.name);
                break;
            case ExtensionConstants.EXTENSION_LOAD_FAIL:
                ExtensionAgent.emit('extension.loadDidFail', args.name);
                break;
            case ExtensionConstants.EXTENSION_UNLOAD_FAIL:
                ExtensionAgent.emit('extension.unloadDidFail', args.name);
                break;
        }
    },

    attach: function(component) {
        if (component.extensionWillLoad)
            ExtensionAgent.on('extension.willLoad', component.extensionWillLoad);
        if (component.extensionWillUnload)
            ExtensionAgent.on('extension.willUnload', component.extensionWillUnload);
        if (component.extensionDidLoad)
            ExtensionAgent.on('extension.didLoad', component.extensionDidLoad);
        if (component.extensionDidUnload)
            ExtensionAgent.on('extension.didUnload', component.extensionDidUnload);
        if (component.extensionLoadFail)
            ExtensionAgent.on('extension.loadDidFail', component.extensionLoadFail);
        if (component.extensionUnloadDidFail)
            ExtensionAgent.on('extension.unloadDidFail', component.extensionUnloadDidFail);
    },

    detach: function(component) {
        if (component.extensionWillLoad)
            ExtensionAgent.off('extension.willLoad', component.extensionWillLoad);
        if (component.extensionWillUnload)
            ExtensionAgent.off('extension.willUnload', component.extensionWillUnload);
        if (component.extensionDidLoad)
            ExtensionAgent.off('extension.didLoad', component.extensionDidLoad);
        if (component.extensionDidUnload)
            ExtensionAgent.off('extension.didUnload', component.extensionDidUnload);
        if (component.extensionLoadFail)
            ExtensionAgent.off('extension.loadDidFail', component.extensionLoadFail);
        if (component.extensionUnloadDidFail)
            ExtensionAgent.off('extension.unloadDidFail', component.extensionUnloadDidFail);
    },

    load: function(module) {
        ExtensionActionCreators.load(module);
    },

    unload: function(module) {
        ExtensionActionCreators.unload(module);
    },

    getExtensionInfo: function(extensionName) {
        return ExtensionStore.getExtensionInfo(extensionName);
    }
});

module.exports = ExtensionAgent;
