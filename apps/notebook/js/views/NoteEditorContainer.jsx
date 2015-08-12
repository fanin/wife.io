var DatabaseActionCreators  = require("../actions/DatabaseActionCreators");
var NotebookConstants       = require("../constants/NotebookConstants");
var NotebookActionConstants = require("../constants/NotebookActionConstants");
var DatabaseStore           = require("../stores/DatabaseStore");
var GritterView             = require("lib/cutie/GritterView");
var DialogController        = require("lib/cutie/Dialog");

var ProgressBarView = React.createClass({
    getInitialState() {
        return {
            progress: 0,
            label: ""
        };
    },

    render() {
        return (
            <div className="ui green progress">
                <div className="bar" style={{width: (this.state.progress + "%")}}></div>
                <div className="label">{this.state.label}</div>
            </div>
        );
    }
});

var FileUploadView = React.createClass({
    getDefaultProps() {
        return {
            uploadFiles: [],
            onAddFile: function() {},
            onRemoveFile: function(file) {}
        };
    },

    render() {
        var fileTableRows = this.props.uploadFiles.map(function(file) {
            return (
                <tr key={file.name}>
                    <td>{file.name}</td>
                    <td className="center aligned collapsing">{file.type}</td>
                    <td className="center aligned collapsing">
                        <div onClick={ function() { this.props.onRemoveFile(file) }.bind(this) }>
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
                            <div className = "ui right floated small primary labeled button"
                                   onClick = {this.props.onAddFile}>
                                Add File
                            </div>
                        </th>
                    </tr>
                </tfoot>
            </table>
        );
    }
});

var NotebookEditor = React.createClass({

    componentDidMount() {
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
                  'Upload','Save' ], '/',
                [ 'Font', 'FontSize', 'Bold', 'Italic', 'Underline', 'Strike',
                  'Subscript', 'Superscript', 'TextColor', 'BGColor', '-',
                  'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-',
                  'Indent', 'Outdent', '-',
                  'Blockquote', '-',
                  'RemoveFormat' ]
            ]
        });
    },

    shouldComponentUpdate(nextProps, nextState) {
        return false;
    },

    render() {
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
    _setDataDelayTimer: null,
    _flushTimer: null,
    _flushAfterDelay: 5000,
    _dragStartInsideEditor: false,
    _unsupportFiles: [],

    getDefaultProps() {
        return {
            takeSnapshot: false,
            snapshotImageWidth: 800
        };
    },

    getInitialState() {
        return {
            searchString: "",
            errorTitle: "",
            errorMessage: "",
            uploadFiles: []
        };
    },

    componentWillMount() {
        DatabaseStore.addChangeListener(this._onDatabaseChange);
    },

    componentDidMount() {
        this.titleContainerInstance    = $(".nb-column-toolbar-title-container");
        this.titleInputInstance        = $(".nb-column-toolbar-title-input");
        this.searchContainerInstance   = $(".nb-column-toolbar-search-container");
        this.searchInputInstance       = $(".nb-column-toolbar-search-input");
        this.editorDimmerInstance      = $(".nb-editor-dimmer").dimmer({ closable: false });
        this.editorDimmerTextInstance  = $(".nb-editor-dimmer > div");
        this.snapshotContainerInstance = $(".nb-snapshot-container");
        this.snapshotBodyInstance      = $(".nb-snapshot-container > div > div");
        this.snapshotContainerInstance.width(this.props.snapshotImageWidth);

        /* Prevent drag and drop on non-editor components */
        $(document).on('dragenter', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            return false;
        });

        $(document).on('dragover', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            return false;
        });

        $(document).on('drop', function(e) {
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

            this.titleInputInstance.on('change keyup paste', function() {
                this._cacheDirtyNote();
            }.bind(this));

            this.titleInputInstance.focusout(function() {
                this._saveNote();
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
                    this._saveNote(null, true);
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

    componentWillUnmount() {
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
    },

    shouldComponentUpdate(nextProps, nextState) {
        return true;
    },

    componentDidUpdate(prevProps, prevState) {
        if (prevState.searchString && !this.state.searchString) {
            /* Restore search input box */
            this._onSearchInputBlur();
        }
        else if (prevState.errorTitle !== this.state.errorTitle
                 || prevState.errorMessage !== this.state.errorMessage) {
            this.refs.alertDialog.show();
        }
    },

    render() {
        var fileUploadView = <FileUploadView ref = "fileUploadView"
                                     uploadFiles = {this.state.uploadFiles}
                                       onAddFile = {this._onDialogAddFile}
                                    onRemoveFile = {this._onDialogRemoveFile} />;
        var progressBarView = <ProgressBarView ref = "progressBarView" />;

        return (
            <div className = "nb-column-container">
                <div className = "nb-snapshot-container">
                    <div>
                        <div />
                    </div>
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
                                 placeholder = "Untitled..." disabled />
                        </div>
                    </div>
                    <div className = "right item nb-column-toolbar-search-container">
                        <div className = {"ui transparent icon input" + (this.state.searchString ? " search" : "")}>
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
                    <input type = "file"
                             id = "upload-files"
                          style = {{display: "none"}}
                       onChange = {this._onDialogFileInputChange} multiple />

                    <DialogController ref = "fileUploadDialog"
                                     size = "large"
                                    title = "Select Files to Upload"
                                  message = ""
                               customView = {fileUploadView}
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
                                 onHidden = {this._onDialogHidden}
                                onApprove = {this._onDialogUpload} />
                </div>

                <DialogController ref = "uploadProgressDialog"
                                title = "File Upload Progress"
                              message = ""
                           customView = {progressBarView}
                        actionButtons = {[{
                                            title: "Cancel",
                                            iconType: "remove",
                                            color: "red",
                                            actionType: "deny"
                                        }]}
                             onHidden = {this._onProgressDialogHidden}
                               onDeny = {this._onProgressDialogCancelUpload} />

                <DialogController ref = "alertDialog"
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

    _onSearchInputFocus() {
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

    _onSearchInputBlur() {
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

    _onSearch() {
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

    _setEditorDimmer(show, text) {
        var animating = this.editorDimmerInstance.hasClass("active");

        if (show && !animating) {
            this.editorDimmerTextInstance.text(text);
            this.editorDimmerInstance.removeClass("hidden")
                                     .addClass("visible active");
        }
        else if (!show && animating) {
            this.editorDimmerInstance.removeClass("visible")
                                     .removeClass("active")
                                     .addClass("hidden");
        }
    },

    _setEditorContent(title, content, cb) {
        if (this._setDataDelayTimer)
            clearTimeout(this._setDataDelayTimer);

        this._setDataDelayTimer = setTimeout(function() {
            this._setDataDelayTimer = undefined;
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

    _setReadOnly(readOnly) {
        this.titleInputInstance.prop("disabled", readOnly);
        this.editorInstance.setReadOnly(readOnly);
    },

    _isReadOnly() {
        return this.titleInputInstance.is(':disabled');
    },

    _readNote() {
        setTimeout(function() {
            DatabaseActionCreators.readNote(DatabaseStore.getSelectedNoteDescriptor());
        }, 0);
    },

    _saveNote(noteDescriptor, manually) {
        if (this._flushTimer) {
            clearTimeout(this._flushTimer);
            this._flushTimer = null;
        }

        noteDescriptor = noteDescriptor || DatabaseStore.getSelectedNoteDescriptor();
        setTimeout(function() {
            DatabaseActionCreators.saveNote(noteDescriptor, manually);
        }.bind(this), 0);
    },

    _flushDirtyNotes() {
        if (this._flushTimer) {
            clearTimeout(this._flushTimer);
            this._flushTimer = null;
        }

        var dirtyNoteDescriptors = DatabaseStore.getDirtyNoteDescriptorList();

        for (var i = 0; i < dirtyNoteDescriptors.length; i++) {
            dirtyNoteDescriptor = dirtyNoteDescriptors[i];
            if (DatabaseStore.getNoteDescriptorStatus(dirtyNoteDescriptor) !== 'Saving')
                this._saveNote(dirtyNoteDescriptor);
        }
    },

    _cacheDirtyNote() {
        if (this._isReadOnly())
            return;

        DatabaseActionCreators.cacheDirtyNote(
            DatabaseStore.getSelectedNoteDescriptor(),
            this.titleInputInstance.val(),
            this.editorInstance.getData()
        );

        if (this._flushTimer)
            clearTimeout(this._flushTimer);

        this._flushTimer = setTimeout(function() {
            this._flushDirtyNotes();
        }.bind(this), this._flushAfterDelay);
    },

    _takeSnapshot(noteDescriptor) {
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

    _handleSaveSuccess(noteDescriptor, manually) {
        if (DatabaseStore.isNoteDescriptorSelected(noteDescriptor)) {
            this._setEditorDimmer(false);
        }
        else {
            DatabaseActionCreators.renewNoteModifyDate(noteDescriptor);
            DatabaseActionCreators.clearUselessAssets(noteDescriptor, 0);
        }

        if (manually)
            GritterView.add("Note Saved", noteDescriptor.noteTitle, "/apps/ia/notebook/img/icon.png", 2000);

        setTimeout(function() { this._flushDirtyNotes() }.bind(this), 0);
    },

    _onDialogFileInputChange() {
        var files = $("#upload-files")[0].files;
        var list = this.state.uploadFiles;

        for (var i = 0; i < files.length; i++) {
            list.push(files[i]);
        }

        this.setState({ uploadFiles: list });
    },

    _onDialogAddFile() {
        $("#upload-files").click();
    },

    _onDialogRemoveFile(file) {
        var files = this.state.uploadFiles;
        files.splice(files.indexOf(file), 1);
        this.setState({ uploadFiles: files });
    },

    _onDialogUpload() {
        var files = this.state.uploadFiles;
        if (files.length > 0)
            DatabaseActionCreators.attachFilesToNote(DatabaseStore.getSelectedNoteDescriptor(), files);
    },

    _onDialogShow() {
        $(".nb-editor-upload-dialog-container").css("zIndex", "1001");
    },

    _onDialogHidden() {
        $(".nb-editor-upload-dialog-container").css("zIndex", "-1");
        this.setState({ uploadFiles: [] });
    },

    _onProgressDialogCancelUpload() {
        DatabaseActionCreators.cancelAttachFile(DatabaseStore.getSelectedNoteDescriptor());
    },

    _onProgressDialogHidden() {
        if (this._unsupportFiles.length > 0) {
            this._showErrorAlert(
                "Attach File Error",
                "File format is not supported:\n\n" + this._unsupportFiles.join(", ")
            );
            this._unsupportFiles = [];
        }

        this._resetUploadProgressBar();
    },

    _resetUploadProgressBar() {
        this.refs.progressBarView.setState({ progress: 0, label: "" });
    },

    _showErrorAlert(errorTitle, errorMessage) {
        this.setState({
            errorTitle: errorTitle,
            errorMessage: errorMessage
        });
    },

    _onDatabaseChange(change) {
        switch (change.actionType) {
            case NotebookActionConstants.NOTEBOOK_DATABASE_OPEN:
                var timer = setInterval(function() {
                    if (this.editorInstance) {
                        clearInterval(timer);
                        DatabaseActionCreators.loadTree();
                    }
                }.bind(this), 100);
                break;
            case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
            case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS:
                var notes = DatabaseStore.getNoteDescriptorList();
                if (notes.length === 0) {
                    this._flushDirtyNotes();
                    this._setReadOnly(true);
                    this._setEditorDimmer(false);
                    this._setEditorContent("", "", function() {
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
                if (DatabaseStore.isNoteDescriptorSelected(change.noteDescriptor)) {
                    var status = DatabaseStore.getNoteDescriptorStatus(change.noteDescriptor);
                    this._setEditorDimmer(true, status);
                    this._setReadOnly(true);
                    if (status === 'Saving')
                        this._setEditorContent(
                            change.noteDescriptor.dirtyNoteTitle || change.noteDescriptor.noteTitle,
                            change.noteDescriptor.dirtyNoteContent || change.noteDescriptor.noteContent
                        );
                }
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE:
                if (DatabaseStore.isNoteDescriptorSelected(change.noteDescriptor)) {
                    if (change.noteDescriptor.saveManually) {
                        this._setEditorDimmer(true, DatabaseStore.getNoteDescriptorStatus(change.noteDescriptor));
                        this._setReadOnly(true);
                    }
                }
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS:
                if (DatabaseStore.isNoteDescriptorSelected(change.noteDescriptor)) {
                    this._setEditorContent(
                        change.noteDescriptor.dirtyNoteTitle || change.noteDescriptor.noteTitle,
                        change.noteDescriptor.dirtyNoteContent || change.noteDescriptor.noteContent,
                        function() {
                            if (!DatabaseStore.getNoteDescriptorStatus(change.noteDescriptor)) {
                                this._setEditorDimmer(false);
                                this._setReadOnly(false);
                            }
                        }.bind(this)
                    );
                }
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS:
                if (DatabaseStore.isNoteDescriptorSelected(change.noteDescriptor))
                    this._setReadOnly(false);
                if (this.props.takeSnapshot)
                    this._takeSnapshot(change.noteDescriptor);
                else
                    this._handleSaveSuccess(change.noteDescriptor, change.manually);
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
                        var _diskUUID = DatabaseStore.getStorage().uuid;
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
                                 * Compose the FSAPI url to access file in userdata.
                                 */
                                "<img src='/api/v1/fs/file/" + encodeURIComponent(_path) + (_diskUUID ? "?disk_uuid=" + _diskUUID : "") +
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
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_ERROR:
                this._unsupportFiles.push(change.file.name);
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_CANCEL_ATTACH_FILE_TO_NOTE:
                this.refs.uploadProgressDialog.hide();
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_ERROR:
                this._flushDirtyNotes();
            case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_ERROR:
                this._setEditorDimmer(false);
                if (DatabaseStore.getError() && DatabaseStore.getError().indexOf("Invalid Format") > 0)
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
