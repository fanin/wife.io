'use strict';

var DiligentStore     = require('../stores/DiligentStore');
var DiligentConstants = require('../constants/DiligentConstants');

var DiligentConsole = React.createClass({
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
        DiligentStore.addDiligentClientInitListener(this._onDiligentClientInitProcedure);
        DiligentStore.addDiligentClientReadyListener(this._onDiligentClientReady);
        DiligentStore.addDiligentClientStopListener(this._onDiligentClientStop);
        DiligentStore.addExtensionListener(this._onExtensionStatus);
    },

    componentWillUnmount: function() {
        DiligentStore.removeExtensionListener(this._onExtensionStatus);
        DiligentStore.removeDiligentClientStopListener(this._onDiligentClientStop);
        DiligentStore.removeDiligentClientReadyListener(this._onDiligentClientReady);
        DiligentStore.removeDiligentClientInitListener(this._onDiligentClientInitProcedure);
    },

    _onDiligentClientReady: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClientInfo().version,
            diligentClientStatus: 'RUNNING'
        });
    },

    _onDiligentClientStop: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClientInfo().version,
            diligentClientStatus: 'STOPPED'
        });
    },

    _onDiligentClientInitProcedure: function() {
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

    _onExtensionStatus: function(extensionName) {
        switch (DiligentStore.getExtensionInfo(extensionName).status) {
            case DiligentConstants.EXTENSION_LOAD:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'LOADING',
                    extensionVersion: DiligentStore.getExtensionInfo(extensionName).version,
                    extensionError: ''
                });
                break;
            case DiligentConstants.EXTENSION_UNLOAD:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'UNLOADING',
                    extensionVersion: DiligentStore.getExtensionInfo(extensionName).version,
                    extensionError: ''
                });
                break;
            case DiligentConstants.EXTENSION_LOAD_SUCCESS:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'LOADED',
                    extensionVersion: DiligentStore.getExtensionInfo(extensionName).version,
                    extensionError: ''
                });
                break;
            case DiligentConstants.EXTENSION_UNLOAD_SUCCESS:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'UNLOADED',
                    extensionVersion: -1,
                    extensionError: ''
                });
                break;
            case DiligentConstants.EXTENSION_LOAD_FAIL:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'LOAD FAILED',
                    extensionVersion: -1,
                    extensionError: DiligentStore.getExtensionInfo(extensionName).error
                });
                break;
            case DiligentConstants.EXTENSION_UNLOAD_FAIL:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'UNLOAD FAILED',
                    extensionVersion: DiligentStore.getExtensionInfo(extensionName).version,
                    extensionError: DiligentStore.getExtensionInfo(extensionName).error
                });
                break;
        }
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
