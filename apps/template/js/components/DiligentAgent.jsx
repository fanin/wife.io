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
            <div className="diligent-agent" style={{display: this.props.debug ? "block" : "none"}}>
                <p>
                    Diligent client status: <mark>{this.state.diligentClientStatus}</mark>
                </p>

                <p>
                    Diligent client version: <mark>{this.state.diligentClientVersion}</mark>
                </p>

                <p>
                    Connection status: <mark>{this.state.diligentConnectionStatus}</mark>
                </p>

                <p>
                    WSAPI status: <mark>{this.state.diligentWSApiStatus}</mark>
                </p>

                <p>
                    Extension status: <mark>{this.state.extensionStatus}</mark>
                </p>

                <p>
                    Extension name: <mark>{this.state.extensionName}</mark>
                </p>

                <p>
                    Extension version: <mark>{this.state.extensionVersion}</mark>
                </p>

                <p>
                    Extension error: <mark>{this.state.extensionError}</mark>
                </p>
            </div>
        );
    }
});

module.exports = DiligentAgent;
