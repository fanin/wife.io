var $TEMPLATE$ActionCreators = require('../actions/$TEMPLATE$ActionCreators');
var $TEMPLATE$Store          = require('../stores/$TEMPLATE$Store');

var $TEMPLATE$MainView = React.createClass({
    getDefaultProps: function() {
        return {};
    },

    propTypes: {

    },

    getInitialState: function() {
        return {};
    },

    componentWillMount: function() {
        DiligentAgent.on('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.on('agent.client.stop', this._onDiligentClientStop);
        // Uncomment this to listen extension events
        //DiligentAgent.on('agent.extension.status', this._onExtensionStatus);
        $TEMPLATE$Store.addChangeListener(this._onStoreChange);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        // Uncomment this to listen extension events
        //DiligentAgent.off('agent.extension.status', this._onExtensionStatus);
        $TEMPLATE$Store.removeChangeListener(this._onStoreChange);
        DiligentAgent.off('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.off('agent.client.stop', this._onDiligentClientStop);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return true;
    },

    componentWillUpdate: function(nextProps, nextState) {

    },

    componentDidUpdate: function(prevProps, prevState) {

    },

    render: function() {
        return (

        );
    },

    _onDiligentClientReady: function() {

    },

    _onDiligentClientStop: function() {

    },

    _onStoreChange: function(change) {

    }
});

module.exports = $TEMPLATE$MainView;
