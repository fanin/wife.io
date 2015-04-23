'use strict';

var DiligentStore      = require('../stores/DiligentStore');
var DiligentConstants  = require('../constants/DiligentConstants');

var DiligentAgentMixin = {
    diligentClientWillLaunch: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentClientStatus: 'INITIATING'
        });
    },

    diligentClientDidLaunch: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentClientStatus: 'RUNNING'
        });
    },

    diligentClientWillTerminate: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentClientStatus: 'TERMINATING'
        });
    },

    diligentClientDidTerminate: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentClientStatus: 'STOPPED'
        });
    },

    diligentConnectionDidEstablish: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentClientStatus: 'ESTABLISHED'
        });
    },

    diligentConnectionDidClose: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentConnectionStatus: 'CLOSED'
        });
    },

    diligentConnectionDidFail: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentConnectionStatus: DiligentStore.getClient().error
        });
    },

    diligentApiDidLoad: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentWSApiStatus: 'SUCCESS'
        });
    },

    diligentApiLoadFail: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClient().version,
            diligentWSApiStatus: 'FAILED'
        });
    }
};

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

    mixins: [
        DiligentAgentMixin,
        ExtensionAgentMixin
    ],

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

    componentWillMount: function() {
        DiligentAgent.attach(this);
        ExtensionAgent.attach(this);
    },

    componentDidMount: function () {
        DiligentAgent.launch();
    },

    componentWillUnmount: function() {
        DiligentAgent.terminate();
        ExtensionAgent.detach(this);
        DiligentAgent.detach(this);
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
