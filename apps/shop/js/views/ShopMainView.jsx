var ShopSectionMyApp   = require('./ShopSectionMyApp.jsx');
var ShopActionCreators = require('../actions/ShopActionCreators');
var ShopStore          = require('../stores/ShopStore');

var ShopMainView = React.createClass({
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
        ShopStore.addChangeListener(this._onStoreChange);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        ShopStore.removeChangeListener(this._onStoreChange);
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
            <div>
                <ShopSectionMyApp />
            </div>
        );
    },

    _onDiligentClientReady: function() {

    },

    _onDiligentClientStop: function() {

    },

    _onStoreChange: function(change) {

    }
});

module.exports = ShopMainView;
