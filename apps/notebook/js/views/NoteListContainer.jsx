var DatabaseActionCreators = require("../actions/DatabaseActionCreators");
var NotebookConstants      = require("../constants/NotebookConstants");
var DatabaseStore          = require("../stores/DatabaseStore");
var ListViewController     = require('framework/cutie/ListView/js/ListViewController.jsx');

var SortMethods = {
    /* Sort by last modified date */
    sortByLastModifiedDate: function(a, b) {
        if (a.noteStat.mtime > b.noteStat.mtime) return -1;
        if (a.noteStat.mtime < b.noteStat.mtime) return 1;
        return 0;
    },
    /* Sort by creation date (newest first) */
    sortByCreationDateNewestFirst: function(a, b) {
        return (b.noteId - a.noteId);
    },
    /* Sort by creation date (oldest first) */
    sortByCreationDateOldestFirst: function(a, b) {
        return (a.noteId - b.noteId);
    },
    /* Sort by title (ascending) */
    sortByTitleAscending: function(a, b) {
        if (a.noteTitle < b.noteTitle) return -1;
        if (a.noteTitle > b.noteTitle) return 1;
        return 0;
    },
    /* Sort by title (descending) */
    sortByTitleDescending: function(a, b) {
        if (a.noteTitle > b.noteTitle) return -1;
        if (a.noteTitle < b.noteTitle) return 1;
        return 0;
    }
};

var NoteListContainer = React.createClass({

    getDefaultProps: function() {
        return {

        };
    },

    getInitialState: function() {
        return {
            disableNewNoteButton: false,
            disableCopyButton: false,
            disableTrashButton: false,
            sortMethod: SortMethods.sortByLastModifiedDate
        };
    },

    componentWillMount: function() {
        DatabaseActionCreators.setNoteSortMethod(this.state.sortMethod);
        DatabaseStore.addChangeListener(this._onDatabaseChange);
    },

    componentDidMount: function() {
        $(".nb-toolbar-sort-dropdown").dropdown({
            action: 'hide',
            transition: 'drop'
        });
    },

    componentWillUnmount: function() {
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return true;
    },

    componentWillUpdate: function(nextProps, nextState) {

    },

    componentDidUpdate: function(prevProps, prevState) {

    },

    render: function() {
        var sortLastModDateClass = (
                this.state.sortMethod === SortMethods.sortByLastModifiedDate
            ) ? "check icon" : "icon";
        var sortNewestCreatDateClass = (
                this.state.sortMethod === SortMethods.sortByCreationDateNewestFirst
            ) ? "check icon" : "icon";
        var sortOldestCreatDateClass = (
                this.state.sortMethod === SortMethods.sortByCreationDateOldestFirst
            ) ? "check icon" : "icon";
        var sortTitleAscClass = (
                this.state.sortMethod === SortMethods.sortByTitleAscending
            ) ? "check icon" : "icon";
        var sortTitleDscClass = (
                this.state.sortMethod === SortMethods.sortByTitleDescending
            ) ? "check icon" : "icon";

        return (
            <div className="nb-column-container">
                <div className="ui menu nb-column-toolbar">
                    <div className="ui pointing dropdown item nb-toolbar-sort-dropdown">
                        <i className="sort content ascending black icon"></i>
                        <div className="menu">
                            <div className="item" onClick={this._sortByModifiedDate}>
                                <i className={sortLastModDateClass}></i>
                                Sort by modified date
                            </div>
                            <div className="item" onClick={this._sortByCreationDateNewestFirst}>
                                <i className={sortNewestCreatDateClass}></i>
                                Sort by creation date (newest first)
                            </div>
                            <div className="item" onClick={this._sortByCreationDateOldestFirst}>
                                <i className={sortOldestCreatDateClass}></i>
                                Sort by creation date (oldest first)
                            </div>
                            <div className="item" onClick={this._sortByTitleAscending}>
                                <i className={sortTitleAscClass}></i>
                                Sort by title (ascending)
                            </div>
                            <div className="item" onClick={this._sortByTitleDescending}>
                                <i className={sortTitleDscClass}></i>
                                Sort by title (descending)
                            </div>
                        </div>
                    </div>
                    <div className={this.state.disableNewNoteButton ? "ui pointing link disabled item" :
                                                                      "ui pointing link item"}
                           onClick={this._writeNote}>
                        <i className="edit icon"></i>
                        New
                    </div>
                    <div className={this.state.disableCopyButton ? "ui pointing link disabled item" :
                                                                   "ui pointing link item"}
                           onClick={this._copyNote}>
                        <i className="copy icon"></i>
                        Copy
                    </div>
                    <div className={this.state.disableTrashButton ? "ui pointing link disabled item" :
                                                                    "ui pointing link item"}
                           onClick={this._trashNote}>
                        <i className="trash outline icon"></i>
                        Trash
                    </div>
                </div>
                <div className="nb-column-content" onScroll={this._onScroll}>
                    <ListViewController ref="noteListController"
                        canManageDataSource={false}
                                 onDataLoad={this._onListDataLoaded}
                                onSelectRow={this._onSelectNote}
                       onRenderListViewItem={this._onRenderListViewItem} />
                </div>
            </div>
        );
    },

    _onDatabaseChange: function(change) {
        switch (change.actionType) {
            case NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK:
                var notebook = DatabaseStore.getSelectedNotebookNode();
                if (notebook && (notebook.id === 1 || notebook.isFolder()))
                    this.setState({ disableNewNoteButton: true });
                else
                    this.setState({ disableNewNoteButton: false });

                setTimeout(function() {
                    DatabaseActionCreators.loadNotes(notebook);
                }, 100);
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
                var notes = DatabaseStore.getNoteDescriptorList();
                this.refs.noteListController.setDataSource(notes);
                if (notes.length === 0)
                    this.setState({
                        disableCopyButton: true,
                        disableTrashButton: true
                    });
                else
                    this.setState({
                        disableCopyButton: false,
                        disableTrashButton: false
                    });
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS:
            case NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_SUCCESS:
                this.refs.noteListController.addRowAtIndex(change.noteDescriptor, change.index);
                this.setState({
                    disableCopyButton: false,
                    disableTrashButton: false
                });
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS:
                this.refs.noteListController.removeRowAtIndex(change.index);
                if (DatabaseStore.getNoteDescriptorList().length === 0)
                    this.setState({
                        disableCopyButton: true,
                        disableTrashButton: true
                    });
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_SET_NOTE_SORT_METHOD:
                this.setState({ sortMethod: change.method });
                if (change.index >= 0)
                    this.refs.noteListController.selectRowAtIndex(change.index);
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR:
                // TODO: show error
                console.log(change.actionType + ": " + DatabaseStore.getError());
                break;
        }
    },

    _sortByModifiedDate: function() {
        DatabaseActionCreators.setNoteSortMethod(SortMethods.sortByLastModifiedDate);
    },

    _sortByCreationDateNewestFirst: function() {
        DatabaseActionCreators.setNoteSortMethod(SortMethods.sortByCreationDateNewestFirst);
    },

    _sortByCreationDateOldestFirst: function() {
        DatabaseActionCreators.setNoteSortMethod(SortMethods.sortByCreationDateOldestFirst);
    },

    _sortByTitleAscending: function() {
        DatabaseActionCreators.setNoteSortMethod(SortMethods.sortByTitleAscending);
    },

    _sortByTitleDescending: function() {
        DatabaseActionCreators.setNoteSortMethod(SortMethods.sortByTitleDescending);
    },

    _onListDataLoaded: function() {
        this.refs.noteListController.selectRowAtIndex(0);
    },

    _onSelectNote: function(index) {
        setTimeout(function() {
            DatabaseActionCreators.selectNote(index);
        }, 100);
    },

    _onRenderListViewItem: function(data) {
        var _mtime = new Date(data.noteStat.mtime);
        var _lmd = _mtime.toLocaleDateString() + " " + _mtime.toLocaleTimeString();

        return {
            titleText: data.noteTitle,
            subtitleText: _lmd,
            detailText: ''
        };
    },

    _writeNote: function() {
        if (!this.state.disableNewNoteButton)
            DatabaseActionCreators.addNote(DatabaseStore.getSelectedNotebookNode(), "", "");
    },

    _copyNote: function() {
        if (this.state.disableCopyButton)
            return;

        DatabaseActionCreators.copyNote(DatabaseStore.getSelectedNoteDescriptor());
    },

    _trashNote: function() {
        if (this.state.disableTrashButton)
            return;

        DatabaseActionCreators.trashNote(DatabaseStore.getSelectedNoteDescriptor());
    }
});

module.exports = NoteListContainer;
