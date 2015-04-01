var BookshelfContainer     = require('./BookshelfContainer.jsx');
var NoteListContainer      = require('./NoteListContainer.jsx');
var NoteEditorContainer    = require('./NoteEditorContainer.jsx');
var NotebookActionCreators = require('../actions/NotebookActionCreators');
var NotebookStore          = require('../stores/NotebookStore');
var DiligentStore            = DiligentAgent.store;

var NotebookMainView = React.createClass({

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
    },

    componentDidMount: function() {
        // Uncomment this to listen extension events
        //DiligentStore.addExtensionListener(this._onExtensionChanges);
        NotebookStore.addChangeListener(this._onStoreChange);
    },

    componentWillUnmount: function() {
        // Uncomment this to listen extension events
        //DiligentStore.removeExtensionListener(this._onExtensionChanges);
        NotebookStore.removeChangeListener(this._onStoreChange);
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
            <div className="nb-main-view">
                <div className="ui three column horizontally padded grid nb-main-grid">
                    <div className="equal height row nb-main-eq-h-row">
                        <div className="two wide red column nb-main-columns">
                            <BookshelfContainer />
                        </div>
                        <div className="two wide blue column nb-main-columns">
                            <NoteListContainer />
                        </div>
                        <div className="six wide green column nb-main-columns">
                            <NoteEditorContainer />
                        </div>
                    </div>
                </div>
            </div>
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

module.exports = NotebookMainView;
