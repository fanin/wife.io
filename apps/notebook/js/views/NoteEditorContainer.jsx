//
// TODO:
// 1. File upload dialog and manager
//
var DatabaseActionCreators  = require("../actions/DatabaseActionCreators");
var NotebookConstants       = require("../constants/NotebookConstants");
var NotebookActionConstants = require("../constants/NotebookActionConstants");
var DatabaseStore           = require("../stores/DatabaseStore");
var GritterView             = require("framework/cutie/GritterView/js/GritterViewController");
var AlertViewController     = require("framework/cutie/AlertView/js/AlertViewController.jsx");
var StringCode              = require('utils/string-code');

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

var FileUploadView = React.createClass({
    getInitialState: function () {
        return {
            uploadFiles: []
        };
    },

    render: function() {
        var fileTableRows = this.state.uploadFiles.map(function(file) {
            var self = this;
            return (
                <tr>
                    <td>{file.name}</td>
                    <td className="center aligned collapsing">{file.type}</td>
                    <td className="center aligned collapsing">
                        <div onClick={function() {self._onRemoveFile(file)}}>
                            <i className="remove circle link big red icon" />
                        </div>
                    </td>
                </tr>
            );
        }.bind(this));

        return (
            <table className="ui celled striped table">
                <thead>
                    <tr>
                        <th>File Name</th>
                        <th className="center aligned collapsing">File Type</th>
                        <th className="center aligned collapsing">Remove</th>
                    </tr>
                </thead>
                <tbody>
                    {fileTableRows}
                </tbody>
                <tfoot>
                    <tr>
                        <th colSpan="3">
                            <input type = "file"
                                     id = "upload-files"
                                  style = {{display: "none"}}
                               onChange = {this._onFileInputChange} multiple />
                            <div className = "ui right floated small primary labeled button"
                                   onClick = {this._onClickAddFile}>
                                Add File
                            </div>
                        </th>
                    </tr>
                </tfoot>
            </table>
        );
    },

    _onClickAddFile: function() {
        $("#upload-files").click();
    },

    _onFileInputChange: function() {
        var files = $("#upload-files")[0].files;
        var list = this.state.uploadFiles;

        for (var i = 0; i < files.length; i++) {
            list.push(files[i]);
        }

        this.setState({ uploadFiles: list });
    },

    _onRemoveFile: function(file) {
        var files = this.state.uploadFiles;
        files.splice(files.indexOf(file), 1);
        this.setState({ uploadFiles: files });
    }
});

var NotebookEditor = React.createClass({
    componentDidMount: function () {
        CKEDITOR.config.readOnly = true;
        CKEDITOR.config.resize_enabled = false;
        CKEDITOR.config.extraPlugins = "menu,panel,justify,image,tableresize,"
                                     + "codesnippet,colorbutton,find,font,mathjax,"
                                     + "youtube,blockquote,pastefromword,pastetext,widget,"
                                     + "contextmenu,tabletools,enterkey,entities,floatingspace,"
                                     + "format,horizontalrule,htmlwriter,indentlist,list,"
                                     + "magicline,removeformat,showborders,sourcearea,specialchar,"
                                     + "scayt,stylescombo,tab,table,undo,"
                                     + "floatpanel,indent,lineutils,listblock,menubutton,"
                                     + "richcombo,panelbutton,dragresize,nbsave,nbupload";
        CKEDITOR.config.removePlugins = "about";
        CKEDITOR.config.skin = "moono";
        CKEDITOR.config.codeSnippet_theme = 'xcode';
        CKEDITOR.addCss(".cke_editable { word-wrap: break-word }");
        CKEDITOR.replace("nb-editor", {
            removeButtons: "",
            removeDialogTabs: "image:advanced",
            toolbar: [
                [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-',
                  'Undo', 'Redo', '-',
                  'Find', 'Replace', '-',
                  'Scayt', '-',
                  'NumberedList', 'BulletedList', '-',
                  'Table', 'HorizontalRule', 'SpecialChar', 'CodeSnippet', 'MathJax', '-',
                  'Youtube', 'wenzgmap', 'Image', '-',
                  'Upload','Save' ],
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
            searchString: "",
            errorTitle: "",
            errorMessage: ""
        };
    },

    componentWillMount: function () {
        DatabaseStore.addChangeListener(this._onDatabaseChange);
    },

    componentDidMount: function() {
        this.titleContainerInstance    = $(".nb-column-toolbar-title-container");
        this.titleInputInstance        = $(".nb-column-toolbar-title-input");
        this.searchContainerInstance   = $(".nb-column-toolbar-search-container");
        this.searchInputInstance       = $(".nb-column-toolbar-search-input");
        this.editorDimmerInstance      = $(".nb-editor-dimmer").dimmer({ closable: false });
        this.editorDimmerTextInstance  = $(".nb-editor-dimmer > div");
        this.snapshotContainerInstance = $(".nb-snapshot-container");
        this.snapshotBodyInstance      = $(".nb-snapshot-container > div");
        this.snapshotContainerInstance.width(this.props.snapshotImageWidth);

        /* Prevent drag and drop on non-editor components */
        $(document).on('dragenter', function (e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            return false;
        });

        $(document).on('dragover', function (e) {
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();
          return false;
        });

        $(document).on('drop', function (e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            return false;
        });

        this.searchInputInstance.keypress(function(event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode === 13)
                this._onSearch();
            return true;
        }.bind(this));

        CKEDITOR.on("instanceReady", function(event) {
            var editor = event.editor;

            this.editorInstance = editor;
            this._setReadOnly(true);
            this._setEditorDimmer(true, "Loading");

            this.titleInputInstance.on('change keyup paste', function() {
                this._cacheDirtyNote();
            }.bind(this));

            this.titleInputInstance.focusout(function() {
                this._cacheDirtyNote(0);
            }.bind(this));

            editor.on("contentDom", function() {
                editor.document.on("drop", function(e) {
                    if (this._dragStartInsideEditor) {
                        this._dragStartInsideEditor = false;
                        /**
                         * NOTE:
                         * drag inside editor won't trigger 'change' event,
                         * here calls inserText to force editor content change.
                         */
                        editor.insertText("");
                        return;
                    }

                    e.data.preventDefault();

                    if (editor.readOnly)
                        return;

                    var files = e.data.$.target.files || e.data.$.dataTransfer.files;

                    DatabaseActionCreators.attachFilesToNote(DatabaseStore.getSelectedNoteDescriptor(), files);
                }.bind(this));

                editor.document.on("dragover", function(e) {
                    editor.focus();
                });
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
                editor.insertHtml(data.replace(/\>&nbsp;\</gi,'\>\<'));
            });

            editor.on("change", function() {
                if (!this._isReadOnly())
                    this._cacheDirtyNote();
            }.bind(this));

            editor.on("blur", function() {
                this._cacheDirtyNote();
            }.bind(this));

            editor.on("nbsave", function() {
                if (!this._isReadOnly()) {
                    this._triggerSaveManually = true;
                    this._saveNote();
                }
            }.bind(this));

            editor.on("nbupload", function() {
                if (!this._isReadOnly())
                    this.refs.fileUploadDialog.show();
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

    componentDidUpdate: function (prevProps, prevState) {
        if (prevState.searchString && !this.state.searchString) {
            /* Restore search input box */
            this._onSearchInputBlur();
        }
    },

    render: function() {
        var fileUploadView = <FileUploadView ref = "fileUploadView" />;
        var progressBarView = <ProgressBarView ref = "progressBarView" />;

        return (
            <div className = "nb-column-container">
                <div className = "nb-snapshot-container">
                    <div />
                </div>

                <div className = "ui inverted dimmer nb-editor-dimmer">
                  <div className = "ui text loader"></div>
                </div>

                <div className = "ui menu nb-column-toolbar">
                    <div className = "item nb-column-toolbar-title-container">
                        <div className = "ui transparent left icon input">
                            <i className = "file text outline icon"></i>
                            <input className = "nb-column-toolbar-title-input"
                                        type = "text"
                                 placeholder = "Untitled..." />
                        </div>
                    </div>
                    <div className = "right item nb-column-toolbar-search-container">
                        <div className = {"ui icon input" + (this.state.searchString ? " search" : "")}>
                            <input className = "nb-column-toolbar-search-input"
                                        type = "text"
                                 placeholder = "Search note..."
                                     onFocus = {this._onSearchInputFocus}
                                      onBlur = {this._onSearchInputBlur}
                                    disabled = {this.state.searchString ? " disabled" : ""} />
                            <i className = {(this.state.searchString ? "remove" : "search")
                                                + " link icon nb-column-toolbar-search-button"}
                                 onClick = {this._onSearch}></i>
                        </div>
                    </div>
                </div>

                <NotebookEditor />

                <div className="nb-editor-upload-dialog-container">
                    <AlertViewController ref = "fileUploadDialog"
                                        size = "large"
                                       title = "Select Files to Upload"
                                     message = ""
                         customViewComponent = {fileUploadView}
                               actionButtons = {[{
                                                    title: "Cancel",
                                                    iconType: "remove",
                                                    color: "red",
                                                    actionType: "deny"
                                                }, {
                                                    title: "Upload",
                                                    iconType: "upload",
                                                    color: "green",
                                                    actionType: "approve"
                                                }]}
                                      onShow = {this._onDialogShow}
                                      onHide = {this._onDialogHide}
                                   onApprove = {this._onDialogUpload} />
                </div>

                <AlertViewController ref = "uploadProgressDialog"
                                   title = "File Upload Progress"
                                 message = ""
                     customViewComponent = {progressBarView}
                           actionButtons = {[{
                                                title: "Cancel",
                                                iconType: "remove",
                                                color: "red",
                                                actionType: "deny"
                                            }]}
                                  onDeny = {this._onProgressDialogCancelUpload} />

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

    _onSearchInputFocus: function() {
        var searchWidth = this.titleContainerInstance.parent().width() / 2;
        if (searchWidth < 150) searchWidth = 150;
        var titleWidth = this.titleContainerInstance.parent().width() - searchWidth;
        this.titleContainerInstance.animate(
            { width: "30%" },
            { duration: 300, queue: false }
        );
        this.searchContainerInstance.animate(
            { width: "70%" },
            { duration: 300, queue: false }
        );
    },

    _onSearchInputBlur: function() {
        if (!this.state.searchString) {
            var titleWidth = this.titleContainerInstance.parent().width() - 150;
            this.titleContainerInstance.animate(
                { width: "70%" },
                { duration: 300, queue: false }
            );
            this.searchContainerInstance.animate(
                { width: "30%" },
                { duration: 300, queue: false }
            );
        }
    },

    _onSearch: function() {
        var notebookNode;

        if (this.state.searchString)
            notebookNode = DatabaseStore.getSelectedNotebookNode();
        else
            notebookNode = DatabaseStore.getSuperNotebookNode();

        if (!this.state.searchString) {
            var searchPattern = this.searchInputInstance.val();
            if (searchPattern) {
                this.setState({ searchString: searchPattern });
                DatabaseActionCreators.loadNotes(notebookNode, searchPattern);
            }
        }
        else {
            this.searchInputInstance.val("");
            this.setState({ searchString: "" });
            DatabaseActionCreators.loadNotes(notebookNode);
        }
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

    _cacheDirtyNote: function(flushDelay) {
        if (this._isReadOnly())
            return;

        if (this._timerFlushEditor)
            clearTimeout(this._timerFlushEditor);

        if (flushDelay === undefined)
            flushDelay = this._flushAfterDelay;

        this._timerFlushEditor = setTimeout(function() {
            this._flushDirtyNotes();
        }.bind(this), flushDelay);

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
            noteDescriptor.noteId === DatabaseStore.getSelectedNoteDescriptor().noteId
            && this._triggerSaveManually
        ) {
            this._setEditorDimmer(false);
            GritterView.add(
                "Note Saved",
                noteDescriptor.noteTitle,
                "/apps/b/notebook/img/icon.png",
                2000
            );
        }
        else if (noteDescriptor.noteId !== DatabaseStore.getSelectedNoteDescriptor().noteId)
            this._removeUselessAssets(noteDescriptor);

        this._flushDirtyNotes();
    },

    _removeUselessAssets: function(noteDescriptor) {
        DatabaseActionCreators.clearUselessAssets(noteDescriptor, 0);
    },

    _onDialogUpload: function() {
        var files = this.refs.fileUploadView.state.uploadFiles;
        if (files.length > 0)
            DatabaseActionCreators.attachFilesToNote(DatabaseStore.getSelectedNoteDescriptor(), files);
    },

    _onDialogShow: function() {
        $(".nb-editor-upload-dialog-container").css("zIndex", "1001");
    },

    _onDialogHide: function() {
        $(".nb-editor-upload-dialog-container").css("zIndex", "-1");
        this.refs.fileUploadView.setState({ uploadFiles: [] });
    },

    _onProgressDialogCancelUpload: function() {
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
            case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
                var notes = DatabaseStore.getNoteDescriptorList();
                if (notes.length === 0) {
                    this._setEditorContent("", "", function() {
                        this._setReadOnly(true);
                    }.bind(this));
                }
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK:
                this.searchInputInstance.val("");
                this.setState({ searchString: "" });
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTE:
                this._flushDirtyNotes();
                this._readNote();
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE:
                this._setEditorDimmer(true, "Loading");
                this._setReadOnly(true);
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS:
                this._setEditorContent(
                    change.noteDescriptor.noteTitle,
                    change.noteDescriptor.noteContent,
                    function() {
                        this._setReadOnly(false);
                    }.bind(this)
                );
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE:
                if (
                    change.noteDescriptor.noteId === DatabaseStore.getSelectedNoteDescriptor().noteId
                    && this._triggerSaveManually
                ) {
                    this._setEditorDimmer(true, "Saving");
                    this._setReadOnly(true);
                }
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS:
                if (change.noteDescriptor.noteId === DatabaseStore.getSelectedNoteDescriptor().noteId)
                    this._setReadOnly(false);
                if (this.props.takeSnapshot)
                    this._takeSnapshot(change.noteDescriptor);
                else
                    this._handleSaveSuccess(change.noteDescriptor);
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS:
                this._handleSaveSuccess(change.noteDescriptor);
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE:
                this.refs.uploadProgressDialog.show();
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_PROGRESS:
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

            case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_SUCCESS:
                this.refs.uploadProgressDialog.hide();
                this._resetUploadProgressBar();
                if (this._unsupportFiles.length > 0) {
                    this._showErrorAlert(
                        "Attach File Error",
                        "File format is not supported:\n\n" + this._unsupportFiles.join(", ")
                    );
                    this._unsupportFiles = [];
                }
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_ERROR:
                this._unsupportFiles.push(change.file.name);
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_CANCEL_ATTACH_FILE_TO_NOTE:
                this._resetUploadProgressBar();
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_ERROR:
                this._flushDirtyNotes();
            case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_ERROR:
                this._setEditorDimmer(false);
                if (DatabaseStore.getError().indexOf("Invalid Format") > 0)
                    this._showErrorAlert(
                        "Notebook Database Error",
                        "Error Code: " + change.actionType + "\n\n" + DatabaseStore.getError()
                    );
                else
                    this._showErrorAlert(
                        "Notebook Database Error",
                        "Error Code: " + change.actionType + "\n\n" + DatabaseStore.getError()
                    );
                break;
        }
    }

});

module.exports = NoteEditorContainer;
