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
        DiligentStore.addDiligentListener(this._onDiligentChanges);
        DiligentStore.addExtensionListener(this._onExtensionChanges);
    },

    componentWillUnmount: function() {
        DiligentStore.removeExtensionListener(this._onExtensionChanges);
        DiligentStore.removeDiligentListener(this._onDiligentChanges);
    },

    _onDiligentChanges: function() {
        switch (DiligentStore.getClient().status) {
            case DiligentConstants.DILIGENT_CLIENT_INITIATE:
                this.setState({
                    diligentClientVersion: DiligentStore.getClient().version,
                    diligentClientStatus: 'INITIATE'
                });
                break;
            case DiligentConstants.DILIGENT_CLIENT_RUNNING:
                this.setState({
                    diligentClientVersion: DiligentStore.getClient().version,
                    diligentClientStatus: 'RUNNING'
                });
                break;
            case DiligentConstants.DILIGENT_CLIENT_TERMINATE:
                this.setState({
                    diligentClientVersion: DiligentStore.getClient().version,
                    diligentClientStatus: 'TERMINATING'
                });
                break;
            case DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED:
                this.setState({
                    diligentClientVersion: DiligentStore.getClient().version,
                    diligentClientStatus: 'ESTABLISHED'
                });
                break;
            case DiligentConstants.DILIGENT_CONNECTION_CLOSED:
                this.setState({
                    diligentClientVersion: DiligentStore.getClient().version,
                    diligentConnectionStatus: 'CLOSED'
                });
                break;
            case DiligentConstants.DILIGENT_CONNECT_FAIL:
                this.setState({
                    diligentClientVersion: DiligentStore.getClient().version,
                    diligentConnectionStatus: DiligentStore.getClient().error
                });
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
                this.setState({
                    diligentClientVersion: DiligentStore.getClient().version,
                    diligentWSApiStatus: 'SUCCESS'
                });
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL:
                this.setState({
                    diligentClientVersion: DiligentStore.getClient().version,
                    diligentWSApiStatus: 'FAILED'
                });
                break;
        }
    },

    _onExtensionChanges: function(extensionName) {
        switch (DiligentStore.getExtension(extensionName).status) {
            case DiligentConstants.EXTENSION_LOAD:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'LOADING',
                    extensionVersion: DiligentStore.getExtension(extensionName).version,
                    extensionError: ''
                });
                break;
            case DiligentConstants.EXTENSION_UNLOAD:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'UNLOADING',
                    extensionVersion: DiligentStore.getExtension(extensionName).version,
                    extensionError: ''
                });
                break;
            case DiligentConstants.EXTENSION_LOAD_SUCCESS:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'LOADED',
                    extensionVersion: DiligentStore.getExtension(extensionName).version,
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
                    extensionError: DiligentStore.getExtension(extensionName).error
                });
                break;
            case DiligentConstants.EXTENSION_UNLOAD_FAIL:
                this.setState({
                    extensionName: extensionName,
                    extensionStatus: 'UNLOAD FAILED',
                    extensionVersion: DiligentStore.getExtension(extensionName).version,
                    extensionError: DiligentStore.getExtension(extensionName).error
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
