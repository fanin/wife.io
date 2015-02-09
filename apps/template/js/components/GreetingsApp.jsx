var React = require('react');
var GreetingsActionCreators = require('../actions/GreetingsActionCreators');
var DiligentStore = require('../stores/DiligentStore');
var GreetingsStore = require('../stores/GreetingsStore');

var GreetingsApp = React.createClass({
    getInitialState: function() {
        return {
            greetingsExtentionLoaded: false,
            greetingsMsg: '',
            rudeMsg: ''
        };
    },

    componentDidMount: function() {
        DiligentStore.addExtensionListener(this._onExtensionChanges);
        GreetingsStore.addChangeListener(this._onReceiveMessage);
    },

    componentWillUnmount: function() {
        GreetingsStore.removeChangeListener(this._onReceiveMessage);
        DiligentStore.removeExtensionListener(this._onExtensionChanges);
    },

    handleExtensionLoad: function(event) {
        if (DiligentStore.getExtension('Greetings').status !== 'LOADED') {
            GreetingsActionCreators.loadExtension();
        }
        else {
            GreetingsActionCreators.unloadExtension();
        }
    },

    _onExtensionChanges: function(extensionName) {
        if (DiligentStore.getExtension(extensionName).status === 'LOADED') {
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

    toggleDebugConsole: function(event) {
        $('.ui.sidebar')
        .sidebar('setting', 'dimPage', false)
        .sidebar('setting', 'closable', false)
        .sidebar('toggle');
    },

    render: function() {
        return (
            <div>
                <h1>Greetings!</h1>
                <h2>This is a React + Flux application template.</h2>
                <p>&nbsp;</p>

                <div className="ui button" onClick={this.toggleDebugConsole}>
                    Toggle Diligent Console
                </div>

                <div className="ui button" onClick={this.handleExtensionLoad}>
                    {(this.state.greetingsExtentionLoaded ? "Unload" : "Load") + " Greetings Extension"}
                </div>

                <div className="greetings" style={{display: this.state.greetingsExtentionLoaded ? "block" : "none"}}>
                    <p>
                        <div className="ui button" onClick={this.handleExtensionTest}>
                            Test Greetings Extension
                        </div>
                    </p>

                    <div className="ui horizontal divider">
                        <i className="bar chart icon"></i>
                        &nbsp;Extension Test Result
                    </div>

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

module.exports = GreetingsApp;
