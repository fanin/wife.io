var BookshelfContainer    = require('./BookshelfContainer.jsx');
var NoteListContainer     = require('./NoteListContainer.jsx');
var NoteEditorContainer   = require('./NoteEditorContainer.jsx');

var AppMainView = React.createClass({
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

module.exports = AppMainView;
