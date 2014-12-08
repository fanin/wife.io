function NoteEditor(fileManager) {
    var self = this;

    self.noteTitle = "";
    self.noteContent = "";
    self.notePath = undefined;
    self.noteIndex = -1;
    self.fileManager = fileManager;
    self.jqueryElement = $("#note-editor");
    self.autoSaveTimer = undefined;
    self.isSavingNote = false;

    /* Build time code */
    self.getTimecode = function() {
        var now = new Date();
        return now.getFullYear()
        + ("0" + (now.getMonth() + 1)).slice(-2)
        + ("0" + now.getDate()).slice(-2)
        + ("0" + now.getHours()).slice(-2)
        + ("0" + now.getMinutes()).slice(-2)
        + ("0" + now.getSeconds()).slice(-2)
        + ("0" + now.getMilliseconds()).slice(-2);
    };

    /* Initialize progress dialog for image uploading */
    self.progressDialog = new Dialog("progress-dialog", "progress");
    self.progressDialog.setTitle("Image Uploader");

    /* Initialize note content */
    $("#note-title-input").prop("disabled", true);

    /* Initialize editor */
    CKEDITOR.replace("note-content-editor");
    CKEDITOR.config.readOnly = true;
    CKEDITOR.config.resize_enabled = false;
    CKEDITOR.config.extraPlugins = "font,customsave,dragresize";
    CKEDITOR.config.removePlugins = "format,link,unlink,anchor,elementspath,about";
    CKEDITOR.config.skin = "icy_orange";
    CKEDITOR.addCss(".cke_editable { word-wrap: break-word }");

    CKEDITOR.on("instanceReady", function(event) {
        var editor = event.editor;

        var setDataDelayTimeout;
        /* This is an workaround to avoid laggy setData */
        self.setContentNoLagWorkaround = function(title, content) {
            if (setDataDelayTimeout) clearTimeout(setDataDelayTimeout);
            setDataDelayTimeout = setTimeout(function() {
                setDataDelayTimeout = undefined;
                /* Avoid memory leak */
                editor.document.clearCustomData();
                editor.document.removeAllListeners();
                editor.window.getFrame().clearCustomData();
                editor.window.getFrame().removeAllListeners();
                /* Set content data */
                editor.setData(content);
                self.noteContent = content;
                /* Set title */
                $("#note-title-input").val(title);
                self.noteTitle = title;
                /* Reset undo history */
                editor.undoManager.reset();
            }, 100);
        };

        /* When user upload an image and remove it from the note, the image file is still under assets folder.
           We scan note and remove unused assets after user complete editing note */
        self.removeUselessAssets = function(notePath) {
            setTimeout(function() {
                self.fileManager.iterateList(
                    dirname(notePath) + "/assets",
                    function(path, item, stat, i, error) {
                        if (error) {
                            console.log("Unable to list " + path + "/" + item);
                            return;
                        }

                        self.fileManager.grep(notePath, item, null, function(path, data, error) {
                            if (error) {
                                console.log("Unable to read " + path);
                                return;
                            }

                            if (!data) {
                                self.fileManager.remove(dirname(notePath) + "/assets/" + item, function(path, error) {
                                    if (error) throw new Error("unable to remove " + path);
                                    console.log("Unused asset '" + item + "' removed");
                                });
                            }
                        });
                    },
                    function(path) {}
                );
            }, 1000);
        }

        /* Recursive image upload */
        function uploadImages(path, files) {
            var index = 0;
            var fileName;
            var stream;

            function upload() {
                if (index >= files.length) {
                    self.progressDialog.setButton([{ text: "Success", click: function() {}}]);
                    self.progressDialog.setButtonEnable(0, false);
                    setTimeout(function() {
                        self.progressDialog.close();
                    }, 1000);
                    return;
                }

                var ext = files[index].name.split(".").pop();
                if (ext) ext = "." + ext;
                fileName = self.getTimecode() + ext;

                if (files[index].type.toLowerCase().indexOf("image") === 0) {
                    self.progressDialog.open();

                    var urlCreator = window.URL || window.webkitURL;
                    var imageUrl = urlCreator.createObjectURL(files[index]);
                    var img = document.createElement("img");
                    img.onload = function() {
                        var targetWidth = this.width;
                        var targetHeight = this.height;
                        var maxWidth = $(".cke_wysiwyg_frame").width() * 0.75;
                        if (this.width > maxWidth) {
                            targetHeight = (this.height / this.width) * maxWidth;
                            targetWidth = maxWidth;
                        }

                        stream = self.fileManager.writeFile(
                            path + "/" + fileName, files[index],
                            /* onComplete */
                            function(path, progress, error) {
                                if (error) throw new Error("unable to write " + path);
                                self.progressDialog.setProgress(100);
                                editor.insertHtml("<img src='userdata/" + path + "' style='width:" + targetWidth + "px; height:" + targetHeight + "px'/>");
                                upload(++index);
                            },
                            /* onProgress */
                            function(path, progress, error) {
                                self.progressDialog.setProgress(progress);
                            }
                        );
                    }
                    img.src = imageUrl;
                }
                else {
                    alert("Not an image");
                }
            }

            self.progressDialog.onProgressEvent({
                change: function() {
                    self.progressDialog.setMessage("Uploading " + files[index].name + ": " + self.progressDialog.progress() + "%");
                },
                complete: function() {
                    self.progressDialog.setMessage(files[index].name + " uploaded!");
                }
            });

            self.progressDialog.setButton([{ text: "Cancel", click: function() {
                index = -1000; /* Force stopping recursive upload */
                self.fileManager.stopWriteStream(path + "/" + fileName, stream);
                self.progressDialog.close();
            }}]);

            upload(0);
        }

        /* Image drag & drop */
        function dropFiles(e) {
            e.data.preventDefault();

            if (editor.readOnly) return;

            var path = dirname(self.notePath);
            var files = e.data.$.target.files || e.data.$.dataTransfer.files;

            uploadImages(path, files);
            self.fileManager.touch(path, function() {});
        }

        function dragoverEffect(e) {
            if (editor.readOnly) return;
        }

        /*
         * Note content management
         */
        function save(notePath, noteIndex, title, content, callback) {
            if (!notePath) {
                callback && callback();
                self.jqueryElement.trigger("note-editor.save-error", noteIndex);
                return;
            }

            var doc = "<html><head><title>" + title + "</title></head><body>" + content + "</body></html>";

            if (self.noteTitle === title && self.noteContent === content) {
                callback && callback();
                self.jqueryElement.trigger("note-editor.nochange", noteIndex);
                return;
            }

            self.fileManager.writeFile(notePath, doc, function(path, progress, error) {
                if (error) {
                    callback && callback();
                    alert("Unable to write " + path);
                    return;
                }

                /* Update last modified time */
                self.fileManager.touch(dirname(notePath), function(path, error) {
                    if (error) {
                        callback && callback();
                        console.log("Unable to touch " + path);
                        return;
                    }

                    self.noteTitle = title;
                    self.noteContent = content;

                    $("#note-snapshot-body").empty();
                    $("#note-snapshot-body").append(content);
                    takeNoteSnapshot(self.fileManager, path + "/note.png");

                    callback && callback();
                    self.jqueryElement.trigger("note-editor.saved", noteIndex);
                });
            });
        }

        /*
         * Grab HTML resources procedure:
         * 1) Find resources with absolute src path on other site (<img src='http://www.somewhere.com/image.jpg'>)
         * 2) Download them to our assets folder
         * 3) Replace resource URL with our assets URL
         */
        function grabResourcesAndSave(notePath, noteIndex, title, content, callback) {
            var re = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/gi;
            var imgs = content.match(re);

            if (imgs && imgs.length > 0) {
                var imgName = self.getTimecode();

                function replaceResource(i) {
                    var src = $(imgs[i]).attr('src');
                    var ext = src.split(".").pop();
                    if (ext) ext = "." + ext;
                    var fileName = (parseInt(imgName) + i).toString() + ext;

                    if (!(new RegExp(/^(userdata)/)).test(src)) {
                        self.fileManager.saveUrlAs(dirname(notePath) + "/assets/" + fileName, src, function(path, error) {
                            if (error) {
                                console.log("Unable to save file from URL " + src);
                                return;
                            }

                            content = content.replace(src, "userdata/" + path);

                            if (i === imgs.length - 1)
                                save(notePath, noteIndex, title, content, callback);
                            else
                                replaceResource(i + 1);
                        });
                    }
                    else {
                        if (i === imgs.length - 1)
                            save(notePath, noteIndex, title, content, callback);
                        else
                            replaceResource(i + 1);
                    }
                }

                replaceResource(0);
            }
            else
                save(notePath, noteIndex, title, content, callback);
        }

        self.scheduleAutoSave = function(wait) {
            if (self.autoSaveTimer) {
                clearTimeout(self.autoSaveTimer);
                self.autoSaveTimer = undefined;
            }

            /* Preserve doc info which is going to save */
            var notePath = self.notePath;
            var noteIndex = self.noteIndex;
            var title = $("#note-title-input").val();
            var content = editor.getData();

            if (wait > 0) {
                self.autoSaveTimer = setTimeout(function() {
                    self.autoSaveTimer = undefined;
                    self.isSavingNote = true;
                    self.jqueryElement.trigger("note-editor.saving");
                    grabResourcesAndSave(notePath, noteIndex, title, content, function() {
                        self.isSavingNote = false;
                    });
                }, wait);
            }
            else {
                /* Rise isSavingNote to to force coming loadContent()/resetContent() calls to wait */
                self.isSavingNote = true;
                self.jqueryElement.trigger("note-editor.saving");
                grabResourcesAndSave(notePath, noteIndex, title, content, function() {
                    self.isSavingNote = false;
                });
            }
        }

        editor.on("contentDom", function() {
            // For Firefox/Chrome
            editor.document.on("drop", dropFiles);
            editor.document.on("dragover", dragoverEffect);
            // For IE
            //editor.document.getBody().on("drop", dropFiles);
            //editor.document.getBody().on("dragover", dragoverEffect);

            editor.focus();
        });

        $("#note-title-input").focusout(function() {
            self.scheduleAutoSave(0);
        });

        editor.on("change", function() {
            self.scheduleAutoSave(3000);
        });

        editor.on("customsave", function() {
            self.scheduleAutoSave(0);
        });

        editor.on("maximize", function(state) {
            if (state.data === CKEDITOR.TRISTATE_ON)
                page.navigationBar.hide();
            else
                page.navigationBar.show();
        });

        self.jqueryElement.trigger("note-editor.ready");
    });
}

NoteEditor.prototype.fitSize = function(width, height) {
    try {
        $("#note-title-input").width(width - 7);
        CKEDITOR.instances["note-content-editor"].resize(width, height - 30);
    } catch (e) {}
}

NoteEditor.prototype.loadContent = function(path, index) {
    var self = this;

    /* Check if last edited note is saved */
    if (self.isSavingNote) {
        /* Last edited note is being saved, defer readFile() work after 500ms and see if it is done */
        setTimeout(function() { self.loadContent(path, index); }, 500);
    }
    else {
        self.fileManager.readFile(path, "utf8", function(path, data, error) {
            if (error) {
                console.log("Unable to read " + path);
                return;
            }

            /* Extract and show title text */
            var title = $("<div></div>").append(data).find("title").text() || "";
            /* Extract and show contents inside <body></body> on CKEDITOR */
            var content = data.match(/\<body[^>]*\>([^]*)\<\/body/m)[1] || "";
            self.setContentNoLagWorkaround(title, content);

            $("#note-title-input").prop("disabled", false);
            CKEDITOR.instances["note-content-editor"].setReadOnly(false);

            self.notePath = path;
            self.noteIndex = index;
        });
    }
}

NoteEditor.prototype.resetContent = function() {
    var self = this;

    /* Check if last edited note is saved */
    if (self.isSavingNote) {
        /* Last edited note is being saved, defer readFile() work after 500ms and see if it is done */
        setTimeout(function() { self.resetContent(); }, 500);
    }
    else {
        /* Stop & clear previous auto save timer */
        if (self.autoSaveTimer) {
            clearTimeout(self.autoSaveTimer);
            self.autoSaveTimer = undefined;
        }

        /* Auto save unsaved content to previous doc immediately */
        if (self.notePath) {
            self.scheduleAutoSave(0);
            self.removeUselessAssets(self.notePath);
        }

        self.notePath = undefined;
        self.noteIndex = -1;

        self.setContentNoLagWorkaround("", "");

        $("#note-title-input").prop("disabled", true);
        CKEDITOR.instances["note-content-editor"].setReadOnly(true);
    }
}
