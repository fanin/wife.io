var React = require('react');
var DiligentAgent = require('./DiligentAgent.jsx');
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

    render: function() {
        return (
            <div>
                <h1>Greetings!</h1>
                <h2>This is a React + Flux architecture application.</h2>

                <DiligentAgent debug={true} />

                <p>
                    <input type="button"
                          value={(this.state.greetingsExtentionLoaded ? "Unload" : "Load") + " Greetings Extension"}
                        onClick={this.handleExtensionLoad} />
                </p>

                <div id='greetings' style={{display: this.state.greetingsExtentionLoaded ? "block" : "none"}}>
                    <p>
                        <input type="button"
                              value="Test Greetings Extension"
                            onClick={this.handleExtensionTest} />
                    </p>

                    <p>
                        Greetings from Extension: <mark>{this.state.greetingsMsg}</mark>
                    </p>

                    <p>
                        Rude message from Extension: <mark>{this.state.rudeMsg}</mark>
                    </p>
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
