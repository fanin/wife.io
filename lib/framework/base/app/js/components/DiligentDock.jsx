var DiligentStore = require('../stores/DiligentStore');

var DiligentDock = React.createClass({
    getInitialState: function() {
        return {

        };
    },

    componentDidMount: function() {
        DiligentStore.addDiligentListener(this._onDiligentChanges);
    },

    componentWillUnmount: function() {
        DiligentStore.removeDiligentListener(this._onDiligentChanges);
    },

    _onDiligentChanges: function() {

    },

    render: function() {
        return (
            <div className="ui inverted labeled icon menu">
                <a className="item">
                    <i className="home icon"></i>
                    Home
                </a>
                <a className="item">
                    <i className="settings icon"></i>
                    Settings
                </a>
            </div>
        );
    }
});

module.exports = DiligentDock;


