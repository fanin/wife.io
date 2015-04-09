'use strict';

var DiligentNavigator      = require('./DiligentNavigator.jsx');
var DiligentDock           = require('./DiligentDock.jsx');
var DiligentConsole        = require('./DiligentConsole.jsx');
var DiligentActionCreators = require('../actions/DiligentActionCreators');
var DiligentConstants      = require('../constants/DiligentConstants');
var DiligentStore          = require('../stores/DiligentStore');

var DiligentAgent = {
    constants: DiligentConstants,

    register: function() {
        DiligentActionCreators.register();
    },

    unregister: function() {
        DiligentActionCreators.unregister();
    },

    getClient: function() {
        return DiligentStore.getClient();
    },

    getClientInfo: function() {
        return DiligentStore.getClientInfo();
    },

    loadExtension: function(extensionModule) {
        DiligentActionCreators.loadExtension(extensionModule);
    },

    unloadExtension: function(extensionModule) {
        DiligentActionCreators.unloadExtension(extensionModule);
    },

    getExtensionInfo: function(extensionName) {
        return DiligentStore.getExtensionInfo(extensionName);
    },

    on: function(eventType, eventHandler) {
        switch (eventType) {
            case 'agent.client.init':
                DiligentStore.addDiligentClientInitListener(eventHandler);
                break;
            case 'agent.client.ready':
                DiligentStore.addDiligentClientReadyListener(eventHandler);
                break;
            case 'agent.client.stop':
                DiligentStore.addDiligentClientStopListener(eventHandler);
                break;
            case 'agent.extension.status':
                DiligentStore.addExtensionListener(eventHandler);
                break;
        }
    },

    off: function(eventType, eventHandler) {
        switch (eventType) {
            case 'agent.client.init':
                DiligentStore.removeDiligentClientInitListener(eventHandler);
                break;
            case 'agent.client.ready':
                DiligentStore.removeDiligentClientReadyListener(eventHandler);
                break;
            case 'agent.client.stop':
                DiligentStore.removeDiligentClientStopListener(eventHandler);
                break;
            case 'agent.extension.status':
                DiligentStore.removeExtensionListener(eventHandler);
                break;
        }
    },

    render: function(opts) {
        React.render(
            <DiligentNavigator debug={opts ? opts.debug : false} />,
            document.getElementById('diligent-navigation-bar')
        );

        React.render(
            <DiligentDock />,
            document.getElementById('diligent-dock')
        );

        React.render(
            <DiligentConsole />,
            document.getElementById('diligent-console')
        );
    }
};

module.exports = DiligentAgent;
