var ShopSectionMyApp   = require('./ShopSectionMyApp.jsx');
var ShopActionCreators = require('../actions/ShopActionCreators');
var ShopStore          = require('../stores/ShopStore');

var DiligentAgentMixin = {
    diligentClientWillLaunch: function() {

    },

    diligentClientDidLaunch: function() {

    },

    diligentClientWillTerminate: function() {

    },

    diligentClientDidTerminate: function() {

    },

    diligentConnectionDidFail: function() {

    }
};

var AppMainView = React.createClass({

    mixins: [ DiligentAgentMixin ],

    getDefaultProps: function() {
        return {};
    },

    propTypes: {

    },

    getInitialState: function() {
        return {};
    },

    componentWillMount: function() {
        ShopStore.addChangeListener(this._onStoreChange);
        DiligentAgent.attach(this);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        DiligentAgent.detach(this);
        ShopStore.removeChangeListener(this._onStoreChange);
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

    _onStoreChange: function(change) {

    }
});

module.exports = AppMainView;
