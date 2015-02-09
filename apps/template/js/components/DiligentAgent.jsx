var React = require('react');
var DiligentActionCreators = require('../actions/DiligentActionCreators');
var DiligentStore = require('../stores/DiligentStore');

var DiligentAgent = React.createClass({
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
        DiligentActionCreators.initiateDiligentClient();
    },

    componentWillUnmount: function() {
        DiligentActionCreators.terminateDiligentClient();
        DiligentStore.removeExtensionListener(this._onExtensionChanges);
        DiligentStore.removeDiligentListener(this._onDiligentChanges);
    },

    _onDiligentChanges: function() {
        this.setState({
            diligentClientVersion: DiligentStore.getClientVersion(),
            diligentClientStatus: DiligentStore.getClientStatus(),
            diligentConnectionStatus: DiligentStore.getConnectionStatus(),
            diligentWSApiStatus: DiligentStore.getWSApiStatus()
        });
    },

    _onExtensionChanges: function(extensionName) {
        var status = DiligentStore.getExtension(extensionName).status;

        if (status === "LOADED")
            this.setState({
                extensionName: extensionName,
                extensionStatus: status,
                extensionVersion: DiligentStore.getExtension(extensionName).version,
                extensionError: DiligentStore.getExtension(extensionName).error || 'no error'
            });
        else
            this.setState({
                extensionName: '',
                extensionStatus: status,
                extensionVersion: -1,
                extensionError: DiligentStore.getExtension(extensionName).error || 'no error'
            });
    },

    render: function() {
        return (
            <div style={{display: this.props.debug ? "block" : "none"}}>
                <table className="ui small table">
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
            </div>
        );
    }
});

module.exports = DiligentAgent;
