//
// TODO:
// 1. File upload dialog and manager
// 2. Search
//
var DatabaseActionCreators = require("../actions/DatabaseActionCreators");
var NotebookConstants      = require("../constants/NotebookConstants");
var DatabaseStore          = require("../stores/DatabaseStore");
var GritterView            = require('framework/cutie/GritterView/js/GritterViewController');
var AlertViewController    = require("framework/cutie/AlertView/js/AlertViewController.jsx");

var ProgressBarView = React.createClass({
    getInitialState: function () {
        return {
            progress: 0,
            label: ""
        };
    },

    render: function() {
        return (
            <div className="ui green progress">
                <div className="bar" style={{width: (this.state.progress + "%")}}></div>
                <div className="label">{this.state.label}</div>
            </div>
        );
    }
});

var NotebookEditor = React.createClass({
    componentDidMount: function () {
        CKEDITOR.config.readOnly = true;
        CKEDITOR.config.resize_enabled = false;
        CKEDITOR.config.extraPlugins = "customsave,dragresize,tableresize,justify";
        CKEDITOR.config.removePlugins = "uploadcare,link,unlink,anchor,elementspath,about";
        CKEDITOR.config.skin = "moono";
        CKEDITOR.config.codeSnippet_theme = 'xcode';
        CKEDITOR.addCss(".cke_editable { word-wrap: break-word }");
        CKEDITOR.replace("nb-editor", {
            removeButtons: "Source, Maximize",
            toolbar: [
                [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-',
                  'Undo', 'Redo', '-',
                  'Find', 'Replace', '-',
                  'Scayt', '-',
                  'NumberedList', 'BulletedList', '-',
                  'Table', 'HorizontalRule', 'SpecialChar', 'CodeSnippet', 'MathJax', '-',
                  'Image','Youtube', 'wenzgmap', '-',
                  'Save' ],
                '/',
                [ 'Font', 'FontSize', 'Bold', 'Italic', 'Underline', 'Strike',
                  'Subscript', 'Superscript', 'TextColor', 'BGColor', '-',
                  'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-',
                  'Indent', 'Outdent', '-',
                  'Blockquote', '-',
                  'RemoveFormat' ]
            ]
        });
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return false;
    },

    render: function() {
        return (
            <div className="nb-column-content nb-editor-container">
                <textarea id="nb-editor" name="nb-editor" />
            </div>
        );
    }
});

var NoteEditorContainer = React.createClass({
    editorInstance: null,
    titleInputInstance: null,
    searchInputInstance: null,
    _timerSetEditorDataDelay: null,
    _timerFlushEditor: null,
    _flushAfterDelay: 5000,
    _triggerSaveManually: false,
    _dragStartInsideEditor: false,
    _unsupportFiles: [],

    getDefaultProps: function () {
        return {
            takeSnapshot: false,
            snapshotImageWidth: 800
        };
    },

    getInitialState: function () {
        return {
            errorTitle: "",
            errorMessage: ""
        };
    },

    componentWillMount: function () {
        DatabaseStore.addChangeListener(this._onDatabaseChange);
    },

    componentDidMount: function() {
        this.searchButtonInstance = $(".nb-column-toolbar-search-button");
        this.searchInputInstance = $(".nb-column-toolbar-search-input");
        this.titleInputInstance = $(".nb-column-toolbar-title-input");
        this.editorDimmerInstance = $(".nb-editor-dimmer").dimmer({ closable: false });
        this.editorDimmerTextInstance = $(".nb-editor-dimmer > div");
        this.snapshotContainerInstance = $(".nb-snapshot-container");
        this.snapshotBodyInstance = $(".nb-snapshot-container > div");
        this.snapshotContainerInstance.width(this.props.snapshotImageWidth);

        CKEDITOR.on("instanceReady", function(event) {
            var editor = event.editor;

            this.editorInstance = editor;
            this._setReadOnly(true);
            this._setEditorDimmer(true, "Loading");

            this.titleInputInstance.on('change keyup paste', function() {
                this._cacheDirtyNote();
            }.bind(this));

            this.titleInputInstance.focusout(function() {
                this._cacheDirtyNote();
            }.bind(this));

            editor.on("contentDom", function() {
                editor.document.on("drop", function(e) {
                    if (this._dragStartInsideEditor) {
                        this._dragStartInsideEditor = false;
                        return;
                    }

                    e.data.preventDefault();

                    if (editor.readOnly)
                        return;

                    var files = e.data.$.target.files || e.data.$.dataTransfer.files;
                    DatabaseActionCreators.attachFilesToNote(DatabaseStore.getSelectedNoteDescriptor(), files);
                }.bind(this));
                //editor.document.on("dragover", dragoverEffect);
                // For IE
                //editor.document.getBody().on("drop", dropFiles);
                //editor.document.getBody().on("dragover", dragoverEffect);

                editor.document.on("dragstart", function() {
                    this._dragStartInsideEditor = true;
                }.bind(this));

                //editor.focus();
                this._setEditorDimmer(false);
            }.bind(this));

            editor.on("paste", function(event) {
                event.stop();
                var data = event.data.dataValue;
                /* Remove single &nbsp; between tags on paste to prevent problems from ckeditor parsing the html content */
                event.editor.insertHtml(data.replace(/\>&nbsp;\</gi,'\>\<'));
            });

            editor.on("change", function() {
                if (!this._isReadOnly())
                    this._cacheDirtyNote();
            }.bind(this));

            editor.on("blur", function() {
                this._cacheDirtyNote();
            }.bind(this));

            editor.on("customsave", function() {
                this._triggerSaveManually = true;
                this._saveNote();
            }.bind(this));

            editor.on("maximize", function(state) {
                if (state.data === CKEDITOR.TRISTATE_ON)
                    ;
            });
        }.bind(this));
    },

    componentWillUnmount: function() {
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        return true;
    },

    render: function() {
        var progressBarView = <ProgressBarView ref="progressBarView" />;
        return (
            <div className="nb-column-container">
                <div className="nb-snapshot-container">
                    <div />
                </div>

                <div className="ui inverted dimmer nb-editor-dimmer">
                  <div className="ui text loader"></div>
                </div>

                <div className="ui menu nb-column-toolbar">
                    <div className="item nb-column-toolbar-title-container">
                        <div className="ui transparent left icon input">
                            <i className="file text outline icon"></i>
                            <input className="nb-column-toolbar-title-input" type="text" placeholder="Untitled..." />
                        </div>
                    </div>
                    <div className="right item nb-column-toolbar-search-container">
                        <div className="ui transparent icon input">
                            <input className="nb-column-toolbar-search-input" type="text" placeholder="Search note..." />
                            <i className="search link icon nb-column-toolbar-search-button"></i>
                        </div>
                    </div>
                </div>

                <NotebookEditor />

                <AlertViewController ref = "alertViewController"
                                   title = "File Upload Progress"
                                 message = ""
                     customViewComponent = {progressBarView}
                           actionButtons = {[{
                                                title: "Cancel",
                                                iconType: "remove",
                                                color: "red",
                                                actionType: "deny",
                                                onClick: this._cancelUploadFile
                                            }]} />
                <AlertViewController ref = "errorAlerter"
                                   title = {this.state.errorTitle}
                                 message = {this.state.errorMessage}
                           actionButtons = {[{
                                                title: "Got It",
                                                color: "red",
                                                actionType: "approve",
                                            }]}
                      actionButtonsAlign = "center" />
            </div>
        );
    },

    _setEditorDimmer: function(show, text) {
        if (show) {
            this.editorDimmerTextInstance.text(text);
            this.editorDimmerInstance.dimmer("show");
        }
        else
            this.editorDimmerInstance.dimmer("hide");
    },

    _setEditorContent: function(title, content, cb) {
        if (this._timerSetEditorDataDelay)
            clearTimeout(this._timerSetEditorDataDelay);

        this._timerSetEditorDataDelay = setTimeout(function() {
            this._timerSetEditorDataDelay = undefined;
            /* Avoid memory leak */
            this.editorInstance.document.clearCustomData();
            this.editorInstance.document.removeAllListeners();
            this.editorInstance.window.getFrame().clearCustomData();
            this.editorInstance.window.getFrame().removeAllListeners();
            /* Set content data */
            this.editorInstance.setData(content);
            /* Set title */
            this.titleInputInstance.val(title);
            /* Reset undo history */
            this.editorInstance.undoManager.reset();
            /* callback */
            cb && cb();
        }.bind(this), 10);
    },

    _setReadOnly: function(readOnly) {
        this.titleInputInstance.prop("disabled", readOnly);
        this.editorInstance.setReadOnly(readOnly);
    },

    _isReadOnly: function() {
        return this.titleInputInstance.is(':disabled');
    },

    _readNote: function() {
        setTimeout(function() {
            DatabaseActionCreators.readNote(DatabaseStore.getSelectedNoteDescriptor());
        }, 1);
    },

    _saveNote: function(noteDescriptor) {
        if (this._timerFlushEditor) {
            clearTimeout(this._timerFlushEditor);
            this._timerFlushEditor = null;
        }

        noteDescriptor = noteDescriptor || DatabaseStore.getSelectedNoteDescriptor();
        setTimeout(function() {
            if (!DatabaseActionCreators.saveNote(noteDescriptor))
                this._handleSaveSuccess(noteDescriptor);
        }.bind(this), 1);
    },

    _flushDirtyNotes: function() {
        if (this._timerFlushEditor) {
            clearTimeout(this._timerFlushEditor);
            this._timerFlushEditor = null;
        }

        var dirtyNoteDescriptor = DatabaseStore.getDirtyNoteDescriptorList().shift();
        if (dirtyNoteDescriptor)
            this._saveNote(dirtyNoteDescriptor);
        else if (this._triggerSaveManually) {
            DatabaseActionCreators.renewNoteModifyDate(DatabaseStore.getSelectedNoteDescriptor());
            this._triggerSaveManually = false;
        }
    },

    _autoFlushDirtyNoteAfterDelay: function() {
        if (this._timerFlushEditor)
            clearTimeout(this._timerFlushEditor);

        this._timerFlushEditor = setTimeout(function() {
            this._flushDirtyNotes();
        }.bind(this), this._flushAfterDelay);
    },

    _cacheDirtyNote: function() {
        if (this._isReadOnly())
            return;

        if (this._timerFlushEditor)
            clearTimeout(this._timerFlushEditor);

        this._autoFlushDirtyNoteAfterDelay();

        DatabaseActionCreators.cacheDirtyNote(
            DatabaseStore.getSelectedNoteDescriptor(),
            this.titleInputInstance.val(),
            this.editorInstance.getData()
        );
    },

    _takeSnapshot: function(noteDescriptor) {
        var _ckeFrame = $(".cke_wysiwyg_frame").contents().find("body");
        this.snapshotBodyInstance.empty();
        this.snapshotBodyInstance.append(noteDescriptor.noteContent);
        setTimeout(function() {
            DatabaseActionCreators.takeNoteSnapshot(
                noteDescriptor,
                this.snapshotContainerInstance,
                null, /* BUG: specify width will make snapshot image cropped */
                this.snapshotBodyInstance.height()
            );
        }.bind(this), 1);
    },

    _handleSaveSuccess: function(noteDescriptor) {
        if (
            noteDescriptor.noteId === DatabaseStore.getSelectedNoteDescriptor().noteId &&
            this._triggerSaveManually
        ) {
            this._setEditorDimmer(false);
            GritterView.add(
                "Note Saved",
                noteDescriptor.noteTitle,
                "/apps/b/notebook/img/icon.png",
                2000
            );
        }

        this._flushDirtyNotes();
    },

    _removeUselessAssets:function(noteDescriptor) {
        DatabaseActionCreators.clearUselessAssets(noteDescriptor, 10000);
    },

    _cancelUploadFile: function() {
        DatabaseActionCreators.cancelAttachFile(DatabaseStore.getSelectedNoteDescriptor());
    },

    _resetUploadProgressBar: function() {
        setTimeout(function() {
            this.refs.progressBarView.setState({ progress: 0, label: "" });
        }.bind(this), 1000);
    },

    _showErrorAlert: function(errorTitle, errorMessage) {
        this.setState({
            errorTitle: errorTitle,
            errorMessage: errorMessage
        });
        this.refs.errorAlerter.show();
    },

    _onDatabaseChange: function(change) {
        switch (change.actionType) {
            case NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTE:
                this._flushDirtyNotes();
                this._readNote();
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_READ_NOTE:
                this._setEditorDimmer(true, "Loading");
                this._setReadOnly(true);
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS:
                this._setEditorContent(
                    change.noteDescriptor.noteTitle,
                    change.noteDescriptor.noteContent,
                    function() {
                        this._setReadOnly(false);
                    }.bind(this)
                );
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_SAVE_NOTE:
                if (
                    change.noteDescriptor.noteId === DatabaseStore.getSelectedNoteDescriptor().noteId &&
                    this._triggerSaveManually
                ) {
                    this._setEditorDimmer(true, "Saving");
                    this._setReadOnly(true);
                }
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS:
                if (change.noteDescriptor.noteId === DatabaseStore.getSelectedNoteDescriptor().noteId)
                    this._setReadOnly(false);
                if (this.props.takeSnapshot)
                    this._takeSnapshot(change.noteDescriptor);
                else
                    this._handleSaveSuccess(change.noteDescriptor);
                this._removeUselessAssets(change.noteDescriptor);
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS:
                this._handleSaveSuccess(change.noteDescriptor);
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE:
                this.refs.alertViewController.show();
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_PROGRESS:
                this.refs.progressBarView.setState({
                    progress: change.noteDescriptor.uploadOverallProgress,
                    label: "Uploading " + change.noteDescriptor.uploadFileObject.name
                });

                if (change.noteDescriptor.uploadProgress === 100) {
                    var _file = change.noteDescriptor.uploadFileObject;
                    var _path = change.noteDescriptor.fileUploadPath;

                    if (_file.type.toLowerCase().indexOf("image") === 0) {
                        var _editor = this.editorInstance;
                        var _diskUUID = StorageAgent.getDiskInUse().uuid;
                        var _urlCreator = window.URL || window.webkitURL;
                        var _imageUrl = _urlCreator.createObjectURL(_file);
                        var _img = document.createElement("img");

                        _img.onload = function() {
                            var _targetWidth = this.width;
                            var _targetHeight = this.height;
                            var _maxWidth = $(".cke_wysiwyg_frame").width() * 0.8;
                            if (this.width > _maxWidth) {
                                _targetHeight = (this.height / this.width) * _maxWidth;
                                _targetWidth = _maxWidth;
                            }

                            _editor.insertHtml(
                                /**
                                 * To access file in userdata, the url must contain a query string 'uuid=xxx'
                                 * to specify the storage where the file is laid on.
                                 */
                                "<img src='userdata/" + _path + (_diskUUID ? "?uuid=" + _diskUUID : "") +
                                "' style='width:" + _targetWidth + "px; height:" + _targetHeight + "px'/>"
                            );
                        }
                        _img.src = _imageUrl;
                    }
                    else {
                        this._unsupportFiles.push(_file.name);
                    }
                }

                break;

            case NotebookConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_SUCCESS:
                this.refs.alertViewController.hide();
                this._resetUploadProgressBar();
                if (this._unsupportFiles.length > 0) {
                    this._showErrorAlert(
                        "Attach File Error",
                        "File format is not supported:\n\n" + this._unsupportFiles.join(", ")
                    );
                    this._unsupportFiles = [];
                }
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_CANCEL_ATTACH_FILE_TO_NOTE:
                this._resetUploadProgressBar();
                break;

            case NotebookConstants.NOTEBOOK_DATABASE_SAVE_NOTE_ERROR:
                this._flushDirtyNotes();
            case NotebookConstants.NOTEBOOK_DATABASE_READ_NOTE_ERROR:
                this._setEditorDimmer(false);
                this._showErrorAlert("Notebook Database Error", change + ":\n" + DatabaseStore.getError());
                break;
        }
    }

});

module.exports = NoteEditorContainer;
