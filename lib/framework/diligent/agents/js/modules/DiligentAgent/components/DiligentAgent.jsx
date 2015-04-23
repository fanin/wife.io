'use strict';

var assign                 = require('object-assign');
var EventEmitter           = require('events').EventEmitter;
var DiligentNavigator      = require('../views/DiligentNavigator.jsx');
var DiligentDock           = require('../views/DiligentDock.jsx');
var DiligentConsole        = require('../views/DiligentConsole.jsx');
var DiligentActionCreators = require('../actions/DiligentActionCreators');
var DiligentConstants      = require('../constants/DiligentConstants');
var DiligentStore          = require('../stores/DiligentStore');

var DiligentAgent = assign({}, EventEmitter.prototype, {
    launch: function() {
        DiligentStore.addDiligentChangeListener(this._onDiligentChange);
        DiligentActionCreators.launch();
    },

    terminate: function() {
        DiligentActionCreators.terminate();
        DiligentStore.removeDiligentChangeListener(this._onDiligentChange);
    },

    _onDiligentChange: function(change) {
        switch (change.actionType) {
            case DiligentConstants.DILIGENT_CLIENT_INITIATE:
                DiligentAgent.emit('agent.clientWillLaunch');
                StorageAgent.init();
                ExtensionAgent.init();
                AppManagerAgent.init();
                break;
            case DiligentConstants.DILIGENT_CLIENT_TERMINATE:
                DiligentAgent.emit('agent.clientWillStop');
                break;
            case DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED:
                DiligentAgent.emit('agent.connectionDidEstablish');
                break;
            case DiligentConstants.DILIGENT_CONNECTION_CLOSED:
                DiligentAgent.emit('agent.connectionDidClose');
                break;
            case DiligentConstants.DILIGENT_CONNECT_FAIL:
                DiligentAgent.emit('agent.connectionDidFail');
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
                DiligentAgent.emit('agent.apiDidLoad');
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL:
                DiligentAgent.emit('agent.apiLoadDidFail');
                break;
            case DiligentConstants.DILIGENT_CLIENT_RUNNING:
                DiligentAgent.emit('agent.clientDidLaunch');
                break;
            case DiligentConstants.DILIGENT_CLIENT_STOPPED:
                StorageAgent.deinit();
                ExtensionAgent.deinit();
                AppManagerAgent.deinit();
                DiligentAgent.emit('agent.clientDidStop');
                break;
        }
    },

    attach: function(component) {
        if (component.diligentClientWillLaunch)
            DiligentAgent.on('agent.clientWillLaunch', component.diligentClientWillLaunch);
        if (component.diligentClientDidLaunch)
            DiligentAgent.on('agent.clientDidLaunch', component.diligentClientDidLaunch);
        if (component.diligentClientWillTerminate)
            DiligentAgent.on('agent.clientWillStop', component.diligentClientWillTerminate);
        if (component.diligentClientDidTerminate)
            DiligentAgent.on('agent.clientDidStop', component.diligentClientDidTerminate);
        if (component.diligentConnectionDidEstablish)
            DiligentAgent.on('agent.connectionDidEstablish', component.diligentConnectionDidEstablish);
        if (component.diligentConnectionDidClose)
            DiligentAgent.on('agent.connectionDidClose', component.diligentConnectionDidClose);
        if (component.diligentConnectionDidFail)
            DiligentAgent.on('agent.connectionDidFail', component.diligentConnectionDidFail);
        if (component.diligentApiDidLoad)
            DiligentAgent.on('agent.apiDidLoad', component.diligentApiDidLoad);
        if (component.diligentApiLoadDidFail)
            DiligentAgent.on('agent.apiLoadDidFail', component.diligentApiLoadDidFail);

    },

    detach: function(component) {
        if (component.diligentClientWillLaunch)
            DiligentAgent.off('agent.clientWillLaunch', component.diligentClientWillLaunch);
        if (component.diligentClientDidLaunch)
            DiligentAgent.off('agent.clientDidLaunch', component.diligentClientDidLaunch);
        if (component.diligentClientWillTerminate)
            DiligentAgent.off('agent.clientWillStop', component.diligentClientWillTerminate);
        if (component.diligentClientDidTerminate)
            DiligentAgent.off('agent.clientDidStop', component.diligentClientDidTerminate);
        if (component.diligentConnectionDidEstablish)
            DiligentAgent.off('agent.connectionDidEstablish', component.diligentConnectionDidEstablish);
        if (component.diligentConnectionDidClose)
            DiligentAgent.off('agent.connectionDidClose', component.diligentConnectionDidClose);
        if (component.diligentConnectionDidFail)
            DiligentAgent.off('agent.connectionDidFail', component.diligentConnectionDidFail);
        if (component.diligentApiDidLoad)
            DiligentAgent.off('agent.apiDidLoad', component.diligentApiDidLoad);
        if (component.diligentApiLoadDidFail)
            DiligentAgent.off('agent.apiLoadDidFail', component.diligentApiLoadDidFail);
    },

    getClient: function() {
        return DiligentStore.getClient();
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
            appView,
            document.getElementById('app-view')
        );

        /* Diligent console is rendered at last due to it is responsible to launch DiligentAgent after it is mounted */
        React.render(
            <DiligentConsole />,
            document.getElementById('diligent-console')
        );
    }
});

module.exports = DiligentAgent;
