'use strict';

var DiligentStore      = require('../stores/DiligentStore');
var DiligentConstants  = require('../constants/DiligentConstants');

var ExtensionAgentMixin = {
    extensionWillLoad: function(extensionName) {
        this.setExtensionState(extensionName);
    },

    extensionDidLoad: function(extensionName) {
        this.setExtensionState(extensionName);
    },

    extensionWillUnload: function(extensionName) {
        this.setExtensionState(extensionName);
    },

    extensionDidUnload: function(extensionName) {
        this.setExtensionState(extensionName);
    },

    extensionLoadFail: function(extensionName) {
        this.setExtensionState(extensionName);
    },

    extensionUnloadFail: function(extensionName) {
        this.setExtensionState(extensionName);
    }
};

var DiligentConsole = React.createClass({

    mixins: [ ExtensionAgentMixin ],

    getInitialState: function() {
        return {
            diligentClientVersion: -1,
            diligentClientStatus: '',
            diligentConnectionStatus: '',
            diligentWSApiStatus: '',
            extensionName: '',
            extensionStatus: '',
            extensionVersion: -1,
            extensionError: ''
        };
    },

    componentDidMount: function() {
        DiligentStore.addClientWillLaunchListener(this._onWillLaunch);
        DiligentStore.addClientDidLaunchListener(this._onDidLaunch);
        DiligentStore.addClientWillStopListener(this._onWillStop);
        DiligentStore.addClientDidStopListener(this._onDidStop);
        ExtensionAgent.attach(this);
    },

    componentWillUnmount: function() {
        ExtensionAgent.detach(this);
        DiligentStore.removeClientWillStopListener(this._onWillLaunch);
        DiligentStore.removeClientDidLaunchListener(this._onDidLaunch);
        DiligentStore.removeClientWillStopListener(this._onWillStop);
        DiligentStore.removeClientDidStopListener(this._onDidStop);
    },

    _onWillLaunch: function() {
        switch (DiligentStore.getClientInfo().status) {
            case DiligentConstants.DILIGENT_CLIENT_INITIATE:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentClientStatus: 'INITIATING'
                });
                break;
            case DiligentConstants.DILIGENT_CLIENT_TERMINATE:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentClientStatus: 'TERMINATING'
                });
                break;
            case DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentClientStatus: 'ESTABLISHED'
                });
                break;
            case DiligentConstants.DILIGENT_CONNECTION_CLOSED:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentConnectionStatus: 'CLOSED'
                });
                break;
            case DiligentConstants.DILIGENT_CONNECT_FAIL:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentConnectionStatus: DiligentStore.getClientInfo().error
                });
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentWSApiStatus: 'SUCCESS'
                });
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentWSApiStatus: 'FAILED'
                });
                break;
            case DiligentConstants.DILIGENT_CLIENT_RUNNING:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentClientStatus: 'RUNNING'
                });
                break;
            case DiligentConstants.DILIGENT_CLIENT_STOPPED:
                this.setState({
                    diligentClientVersion: DiligentStore.getClientInfo().version,
                    diligentClientStatus: 'STOPPED'
                });
                break;
        }
    },

    _onDidLaunch: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClientInfo().version,
            diligentClientStatus: 'RUNNING'
        });
    },

    _onWillStop: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClientInfo().version,
            diligentClientStatus: 'STOPPING'
        });
    },

    _onDidStop: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClientInfo().version,
            diligentClientStatus: 'STOPPED'
        });
    },

    setExtensionState: function(extensionName) {
        this.setState({
            extensionName: extensionName,
            extensionStatus: ExtensionAgent.getExtensionInfo(extensionName).status,
            extensionVersion: ExtensionAgent.getExtensionInfo(extensionName).version,
            extensionError: ExtensionAgent.getExtensionInfo(extensionName).error
        });
    },

    render: function() {
        return (
            <table className="ui small compact table">
                <thead>
                    <tr>
                        <th>Information</th>
                        <th className="twelve wide">Result</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Diligent client status</td>
                        <td>{this.state.diligentClientStatus}</td>
                    </tr>
                    <tr>
                        <td>Diligent client version</td>
                        <td>{this.state.diligentClientVersion}</td>
                    </tr>
                    <tr>
                        <td>Connection status</td>
                        <td>{this.state.diligentConnectionStatus}</td>
                    </tr>
                    <tr>
                        <td>WSAPI status</td>
                        <td>{this.state.diligentWSApiStatus}</td>
                    </tr>
                    <tr>
                        <td>Extension status</td>
                        <td>{this.state.extensionStatus}</td>
                    </tr>
                    <tr>
                        <td>Extension name</td>
                        <td>{this.state.extensionName}</td>
                    </tr>
                    <tr>
                        <td>Extension version</td>
                        <td>{this.state.extensionVersion}</td>
                    </tr>
                    <tr>
                        <td>Extension error</td>
                        <td>{this.state.extensionError}</td>
                    </tr>
                </tbody>
            </table>
        );
    }
});

module.exports = DiligentConsole;
