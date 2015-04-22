var $TEMPLATE$ActionCreators = require('../actions/$TEMPLATE$ActionCreators');
var $TEMPLATE$Store          = require('../stores/$TEMPLATE$Store');

var DiligentAgentMixin = {
    diligentClientWillLaunch: function() {

    },

    diligentClientDidLaunch: function() {

    },

    diligentClientWillTerminate: function() {

    },

    diligentClientDidTerminate: function() {

    },

    diligentConnectionDidEstablish: function() {

    },

    diligentConnectionDidClose: function() {

    },

    diligentConnectionDidFail: function() {

    },

    diligentApiDidLoad: function() {

    },

    diligentApiLoadFail: function() {

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
        $TEMPLATE$Store.addChangeListener(this._onStoreChange);
        DiligentAgent.attach(this);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        DiligentAgent.detach(this);
        $TEMPLATE$Store.removeChangeListener(this._onStoreChange);
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

    _onStoreChange: function(change) {

    }
});

module.exports = AppMainView;
