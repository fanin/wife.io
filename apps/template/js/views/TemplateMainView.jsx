var $TEMPLATE$ActionCreators = require('../actions/$TEMPLATE$ActionCreators');
var $TEMPLATE$Store          = require('../stores/$TEMPLATE$Store');
var DiligentStore            = DiligentAgent.store;

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
        DiligentStore.addDiligentListener(this._onDiligentChanges);
        $TEMPLATE$ActionCreators.register();
    },

    componentDidMount: function() {
        // Uncomment this to listen extension events
        //DiligentStore.addExtensionListener(this._onExtensionChanges);
        $TEMPLATE$Store.addChangeListener(this._onStoreChange);
    },

    componentWillUnmount: function() {
        $TEMPLATE$ActionCreators.unregister();
        // Uncomment this to listen extension events
        //DiligentStore.removeExtensionListener(this._onExtensionChanges);
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

    _onDiligentChanges: function() {
        switch (DiligentStore.getClient().status) {
            case DiligentConstants.DILIGENT_CLIENT_INITIATE:
                break;
            case DiligentConstants.DILIGENT_CLIENT_RUNNING:
                break;
            case DiligentConstants.DILIGENT_CLIENT_TERMINATE:
                break;
            case DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED:
                break;
            case DiligentConstants.DILIGENT_CONNECTION_CLOSED:
                break;
            case DiligentConstants.DILIGENT_CONNECT_FAIL:
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL:
                break;
        }
    },

    _onStoreChange: function(change) {

    }
});

module.exports = $TEMPLATE$MainView;
