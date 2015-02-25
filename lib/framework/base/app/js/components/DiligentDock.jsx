var DiligentStore = require('../stores/DiligentStore');

var DiligentDock = React.createClass({
    getInitialState: function() {
        return {

        };
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {

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


