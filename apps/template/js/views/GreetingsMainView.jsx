var GreetingsActionCreators = require("../actions/GreetingsActionCreators");
var GreetingsStore          = require("../stores/GreetingsStore");

var DiligentAgentMixin = {
    diligentAgentWillLaunch: function() {

    },

    diligentAgentDidLaunch: function() {
        this.setState({ disabled: false });
    },

    diligentAgentWillStop: function() {

    },

    diligentAgentDidStop: function() {
        this.setState({ disabled: true });
    }
};

var ExtensionAgentMixin = {
    extensionWillLoad: function(extensionName) {

    },

    extensionDidLoad: function(extensionName) {
        this.setState({ greetingsExtentionLoaded: true });
    },

    extensionWillUnload: function(extensionName) {

    },

    extensionDidUnload: function(extensionName) {
        this.setState({ greetingsExtentionLoaded: false });
        this.setState({ greetingsMsg: "", rudeMsg: "" });
    },

    extensionLoadFail: function(extensionName) {

    },

    extensionUnloadFail: function(extensionName) {

    }
};

var GreetingsMainView = React.createClass({

    mixins: [
        DiligentAgentMixin,
        ExtensionAgentMixin
    ],

    getInitialState: function() {
        return {
            disabled: true,
            greetingsExtentionLoaded: false,
            greetingsMsg: "",
            rudeMsg: ""
        };
    },

    componentWillMount: function() {
        GreetingsStore.addChangeListener(this._onReceiveMessage);
        DiligentAgent.attach(this);
        ExtensionAgent.attach(this);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        ExtensionAgent.detach(this);
        DiligentAgent.detach(this);
        GreetingsStore.removeChangeListener(this._onReceiveMessage);
    },

    render: function() {
        var buttonClass = this.state.disabled ? "ui disabled button" : "ui button";

        return (
            <div>
                <p>&nbsp;</p>
                <h1>Greetings!</h1>
                <h2>This is a React + Flux application template.</h2>
                <p>&nbsp;</p>

                <div className={buttonClass} onClick={this.toggleExtension}>
                    {(this.state.greetingsExtentionLoaded ? "Unload" : "Load") + " Greetings Extension"}
                </div>

                <div className="greetings" style={{display: this.state.greetingsExtentionLoaded ? "block" : "none"}}>
                    <p>
                        <div className={buttonClass} onClick={this.testExtension}>
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

    toggleExtension: function(event) {
        if (this.state.disabled)
            return;

        if (ExtensionAgent.getExtensionInfo("Greetings").status !== "Loaded") {
            GreetingsActionCreators.loadExtension();
        }
        else {
            GreetingsActionCreators.unloadExtension();
        }
    },

    testExtension: function(event) {
        if (this.state.disabled)
            return;

        this.setState({ greetingsMsg: "", rudeMsg: "" });
        GreetingsActionCreators.sayHello("Mu", "Kenny");
    },

    _onReceiveMessage: function() {
        this.setState({
            greetingsMsg: GreetingsStore.getGreetingsMsg(),
            rudeMsg: GreetingsStore.getRudeMsg()
        });
    }
});

module.exports = GreetingsMainView;
