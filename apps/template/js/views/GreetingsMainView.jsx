var GreetingsActionCreators = require('../actions/GreetingsActionCreators');
var GreetingsStore          = require('../stores/GreetingsStore');

var GreetingsMainView = React.createClass({
    getInitialState: function() {
        return {
            greetingsExtentionLoaded: false,
            greetingsMsg: '',
            rudeMsg: ''
        };
    },

    componentWillMount: function() {
        DiligentAgent.on('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.on('agent.client.stop', this._onDiligentClientStop);
        DiligentAgent.on('agent.extension.status', this._onExtensionStatus);
        GreetingsStore.addChangeListener(this._onReceiveMessage);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        GreetingsStore.removeChangeListener(this._onReceiveMessage);
        DiligentAgent.off('agent.extension.status', this._onExtensionStatus);
        DiligentAgent.off('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.off('agent.client.stop', this._onDiligentClientStop);
    },

    handleExtensionLoad: function(event) {
        if (DiligentAgent.getExtensionInfo('Greetings').status !== DiligentAgent.constants.EXTENSION_LOAD_SUCCESS) {
            GreetingsActionCreators.loadExtension();
        }
        else {
            GreetingsActionCreators.unloadExtension();
        }
    },

    _onDiligentClientReady: function() {

    },

    _onDiligentClientStop: function() {

    },

    _onExtensionStatus: function(extensionName) {
        if (DiligentAgent.getExtensionInfo(extensionName).status === DiligentAgent.constants.EXTENSION_LOAD_SUCCESS) {
            this.setState({ greetingsExtentionLoaded: true });
        }
        else {
            this.setState({ greetingsExtentionLoaded: false });
            this.setState({ greetingsMsg: '', rudeMsg: '' });
        }
    },

    handleExtensionTest: function(event) {
        this.setState({ greetingsMsg: '', rudeMsg: '' });
        GreetingsActionCreators.sayHello('Mac', 'Kenny');
    },

    render: function() {
        return (
            <div>
                <h1>Greetings!</h1>
                <h2>This is a React + Flux application template.</h2>
                <p>&nbsp;</p>

                <div className="ui button" onClick={this.handleExtensionLoad}>
                    {(this.state.greetingsExtentionLoaded ? "Unload" : "Load") + " Greetings Extension"}
                </div>

                <div className="greetings" style={{display: this.state.greetingsExtentionLoaded ? "block" : "none"}}>
                    <p>
                        <div className="ui button" onClick={this.handleExtensionTest}>
                            Test Greetings Extension
                        </div>
                    </p>
                    <p>&nbsp;</p>

                    <div className="ui inverted horizontal divider">
                        <i className="bar inverted chart icon"></i>
                        &nbsp;Extension Test Result
                    </div>
                    <p>&nbsp;</p>

                    <table className="ui definition table">
                        <tbody>
                            <tr>
                                <td className="five wide column">Greetings from Extension</td>
                                <td>{this.state.greetingsMsg}</td>
                            </tr>
                            <tr>
                                <td>Rude message from Extension</td>
                                <td>{this.state.rudeMsg}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    },

    _onReceiveMessage: function() {
        this.setState({
            greetingsMsg: GreetingsStore.getGreetingsMsg(),
            rudeMsg: GreetingsStore.getRudeMsg()
        });
    }
});

module.exports = GreetingsMainView;
