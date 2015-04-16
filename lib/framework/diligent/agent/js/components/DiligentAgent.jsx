'use strict';

var assign                 = require('object-assign');
var EventEmitter           = require('events').EventEmitter;
var DiligentNavigator      = require('./DiligentNavigator.jsx');
var DiligentDock           = require('./DiligentDock.jsx');
var DiligentConsole        = require('./DiligentConsole.jsx');
var DiligentActionCreators = require('../actions/DiligentActionCreators');
var DiligentConstants      = require('../constants/DiligentConstants');
var DiligentStore          = require('../stores/DiligentStore');

var DiligentAgent = assign({}, EventEmitter.prototype, {
    init: function() {
        DiligentStore.addClientWillLaunchListener(this._onWillLaunch);
        DiligentStore.addClientDidLaunchListener(this._onDidLaunch);
        DiligentStore.addClientWillStopListener(this._onWillStop);
        DiligentStore.addClientDidStopListener(this._onDidStop);
        DiligentActionCreators.register();
    },

    deinit: function() {
        DiligentActionCreators.unregister();
        DiligentStore.removeClientWillStopListener(this._onWillLaunch);
        DiligentStore.removeClientDidLaunchListener(this._onDidLaunch);
        DiligentStore.removeClientWillStopListener(this._onWillStop);
        DiligentStore.removeClientDidStopListener(this._onDidStop);
    },

    _onWillLaunch: function() {
        DiligentAgent.emit('agent.willLaunch');
    },

    _onDidLaunch: function() {
        ExtensionAgent.init();
        StorageAgent.init();
        DiligentAgent.emit('agent.didLaunch');
    },

    _onWillStop: function() {
        DiligentAgent.emit('agent.willStop');
    },

    _onDidStop: function() {
        DiligentAgent.emit('agent.didStop');
        StorageAgent.deinit();
        ExtensionAgent.deinit();
    },

    attach: function(component) {
        if (component.diligentAgentWillLaunch)
            DiligentAgent.on('agent.willLaunch', component.diligentAgentWillLaunch);
        if (component.diligentAgentDidLaunch)
            DiligentAgent.on('agent.didLaunch', component.diligentAgentDidLaunch);
        if (component.diligentAgentWillStop)
            DiligentAgent.on('agent.willStop', component.diligentAgentWillStop);
        if (component.diligentAgentDidStop)
            DiligentAgent.on('agent.didStop', component.diligentAgentDidStop);
    },

    detach: function(component) {
        if (component.diligentAgentWillLaunch)
            DiligentAgent.off('agent.willLaunch', component.diligentAgentWillLaunch);
        if (component.diligentAgentDidLaunch)
            DiligentAgent.off('agent.didLaunch', component.diligentAgentDidLaunch);
        if (component.diligentAgentWillStop)
            DiligentAgent.off('agent.willStop', component.diligentAgentWillStop);
        if (component.diligentAgentDidStop)
            DiligentAgent.off('agent.didStop', component.diligentAgentDidStop);
    },

    getClient: function() {
        return DiligentStore.getClient();
    },

    getClientInfo: function() {
        return DiligentStore.getClientInfo();
    },

    render: function(appView, opts) {
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

        React.render(
            appView,
            document.getElementById('app-view')
        );
    }
});

module.exports = DiligentAgent;
