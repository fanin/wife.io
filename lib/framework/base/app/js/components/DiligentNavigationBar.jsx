var DiligentActionCreators = require('../actions/DiligentActionCreators');
var DiligentStore          = require('../stores/DiligentStore');

var DiligentNavigationBar = React.createClass({
    getInitialState: function() {
        return {

        };
    },

    componentDidMount: function() {
        DiligentStore.addDiligentListener(this._onDiligentChanges);
        DiligentActionCreators.initiateDiligentClient();
    },

    componentWillUnmount: function() {
        DiligentActionCreators.terminateDiligentClient();
        DiligentStore.removeDiligentListener(this._onDiligentChanges);
    },

    _onDiligentChanges: function() {

    },

    toggleDock: function(event) {
        $('#diligent-dock')
        .sidebar('setting', 'transition', 'push')
        .sidebar('setting', 'dimPage', false)
        .sidebar('toggle');
    },

    toggleConsole: function(event) {
        $('#diligent-console')
        .sidebar('setting', 'transition', 'overlay')
        .sidebar('setting', 'dimPage', false)
        .sidebar('setting', 'closable', false)
        .sidebar('toggle');
    },

    render: function() {
        return (
            <div className="ui fixed inverted main menu">
                <a className="item" onClick={this.toggleDock}>
                    <i className="content icon"></i>
                </a>
                <a className="item" style={{display: this.props.debug ? "inline-block" : "none"}} onClick={this.toggleConsole}>
                    <i className="bug icon"></i>
                </a>
            </div>
        );
    }
});

module.exports = DiligentNavigationBar;


