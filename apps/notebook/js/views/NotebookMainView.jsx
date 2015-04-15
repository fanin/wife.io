var BookshelfContainer    = require('./BookshelfContainer.jsx');
var NoteListContainer     = require('./NoteListContainer.jsx');
var NoteEditorContainer   = require('./NoteEditorContainer.jsx');

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
        DiligentAgent.on('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.on('agent.client.stop', this._onDiligentClientStop);
    },

    componentDidMount: function() {
        // Uncomment this to listen extension events
        //DiligentAgent.on('agent.extension.status', this._onExtensionStatus);
    },

    componentWillUnmount: function() {
        // Uncomment this to listen extension events
        //DiligentAgent.off('agent.extension.status', this._onExtensionStatus);
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

    _onDiligentClientReady: function() {

    },

    _onDiligentClientStop: function() {

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
    }

});

module.exports = NotebookMainView;
