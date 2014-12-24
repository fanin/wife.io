function NoteEditor(viewController, config) {
    var self = this;

    self.noteTitle = "";
    self.noteContent = "";
    self.notePath = undefined;
    self.noteIndex = -1;
    self.fileManager = viewController.fileManagerClient;
    self.jqueryElement = $("#note-editor");
    self.autoSaveTimer = undefined;
    self.status = {
        editorReady: false,
        savingNote: false,
        flushingNote: false,
    };
    self.config = {
        maxWidth: (config.maxWidth !== undefined) ? config.maxWidth : 0,
        snapshot: (config.snapshot !== undefined) ? config.snapshot : false,
    };

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
    CKEDITOR.config.readOnly = true;
    CKEDITOR.config.resize_enabled = false;
    CKEDITOR.config.extraPlugins = "font,customsave,screenshotarea,dragresize";
    CKEDITOR.config.removePlugins = "format,link,unlink,anchor,elementspath,about";
    CKEDITOR.config.allowedContent = "img[!*]";
    CKEDITOR.config.skin = "icy_orange";
    CKEDITOR.addCss(".cke_editable { word-wrap: break-word }");
    CKEDITOR.replace("note-content-editor");

    CKEDITOR.on("instanceReady", function(event) {
        var editor = event.editor;

        var setDataDelayTimeout;
        /* This is an workaround to avoid laggy setData */
        self.setContentNoLagWorkaround = function(title, content, cb) {
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
                /* callback */
                cb && cb();
            }, 100);
        };

        /**
         * When user upload an image and remove it from the note, the image file is still under assets folder.
         * We scan note and remove unused assets after user complete editing note.
         */
        self.removeUselessAssets = function(notePath, after, cb) {
            setTimeout(function() {
                self.fileManager.list(
                    dirname(notePath) + "/assets",
                    function(path, items, error) {
                        if (error) {
                            console.log("Unable to list " + path);
                            cb && cb(error);
                            return;
                        }

                        function removeUseless(i) {
                            self.fileManager.grep(notePath, items[i], null, function(path, data, error) {
                                if (error) {
                                    console.log("Unable to read " + path);
                                    cb && cb(error);
                                    return;
                                }

                                if (!data) {
                                    self.fileManager.remove(dirname(notePath) + "/assets/" + items[i], function(path, error) {
                                        if (error) {
                                            console.log("unable to remove " + path);
                                            cb && cb(error);
                                        }
                                        else {
                                            //console.log("Unused asset '" + items[i] + "' removed");
                                            if (i === items.length - 1)
                                                cb && cb();
                                            else
                                                removeUseless(i + 1);
                                        }
                                    });
                                }
                                else {
                                    if (i === items.length - 1)
                                        cb && cb();
                                    else
                                        removeUseless(i + 1);
                                }
                            });
                        }

                        if (items.length > 0)
                            removeUseless(0);
                        else
                            cb && cb();
                    }
                );
            }, after);
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
                        var maxWidth = $(".cke_wysiwyg_frame").width() * 0.8;
                        if (this.width > maxWidth) {
                            targetHeight = (this.height / this.width) * maxWidth;
                            targetWidth = maxWidth;
                        }

                        stream = self.fileManager.writeFile(
                            path + "/" + fileName, files[index],
                            /* onComplete */
                            function(path, progress, error) {
                                if (error) {
                                    console.log("Error occurs while writting " + path + " (error: " + error + ")");
                                }

                                self.progressDialog.setProgress(100);
                                editor.insertHtml(
                                    /*
                                     * To access file in userdata, the url must contain a query string 'sid=uuid'
                                     * to specify the storage where the file is laid on.
                                     */
                                    "<img src='userdata/" + path + (self.storageUUID ? "?sid=" + self.storageUUID : "") +
                                    "' style='width:" + targetWidth + "px; height:" + targetHeight + "px'/>"
                                );
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

            var path = dirname(self.notePath) + "/assets";
            var files = e.data.$.target.files || e.data.$.dataTransfer.files;

            uploadImages(path, files);
            self.fileManager.touch(path, function() {});
        }

        function dragoverEffect(e) {
            e.data.preventDefault();
            if (editor.readOnly) return;
        }

        /*
         * note-summary.json management
         */
        function updateNoteSummary(path, title, content, cb) {
            var summary = { title: title };
            var screenshotAreas = content.match(/screenshot-(................).png/gm);

            if (screenshotAreas) {
                summary.screenshot_area = [];
                for (var i in screenshotAreas) {
                    var area = screenshotAreas[i].match(/screenshot-(................).png/m);
                    var screenshotId = "screenshot-" + area[1];
                    var element = editor.document.getById(screenshotId);

                    if (element) {
                        summary.screenshot_area.push({
                            file: screenshotId + ".png",
                            x: element.$.offsetLeft,
                            y: element.$.offsetTop,
                            width: element.$.offsetWidth,
                            height: element.$.offsetHeight
                        });
                    }
                }

                /* Sort screenshot_area ascending by their y position */
                summary.screenshot_area.sort(function(a, b) { return a.y - b.y });
            }

            self.fileManager.writeFile(path + "/note-summary.json", JSON.stringify(summary), function(path, progress, error) {
                if (error) {
                    alert("FATAL ERROR: Unable to update " + path);
                }
                cb && cb(error);
            });
        }

        /**
         * Save note content
         */
        function save(notePath, noteIndex, title, content, cb) {
            if (!notePath) {
                cb && cb("Inavlid Path");
                self.jqueryElement.trigger("note-editor.save-error", noteIndex);
                return;
            }

            if (!title || title.trim() === "")
                title = "Untitled";

            var doc = "<html><head><title>" + title + "</title></head><body>" + content + "</body></html>";

            if (self.noteTitle === title && self.noteContent === content) {
                self.jqueryElement.trigger("note-editor.nochange", noteIndex);
                cb && cb();
                return;
            }

            self.fileManager.writeFile(notePath, doc, function(path, progress, error) {
                if (error) {
                    cb && cb(error);
                    console.log("Unable to write " + path);
                    return;
                }

                /* Update note-summary.json */
                updateNoteSummary(dirname(notePath), title, content);

                /* Update last modified time */
                self.fileManager.touch(dirname(notePath), function(path, error) {
                    if (error) {
                        cb && cb(error);
                        console.log("Unable to touch " + path);
                        return;
                    }

                    self.noteTitle = title;
                    self.noteContent = content;

                    if (self.config.snapshot) {
                        $("#note-snapshot-body").empty();
                        $("#note-snapshot-body").append(content);

                        takeNoteSnapshot(path + "/note.png", function() {
                            cb && cb();
                            self.jqueryElement.trigger("note-editor.saved", noteIndex);
                        });
                    }
                    else {
                        cb && cb();
                    }
                });
            });
        }

        /**
         * Take note content snapshot using html2canvas.js and save as png
         */
        include("apps/b/notebook/lib/html2canvas/html2canvas.js");

        function takeNoteSnapshot(saveTo, cb) {
            /* Adjust body width & height while body size in $(".cke_wysiwyg_frame") may be changed by vertical scroll bar */
            $("#note-snapshot-body").css("width", $(".cke_wysiwyg_frame").contents().find("body").css("width"));
            $("#note-snapshot-body").css("height", $(".cke_wysiwyg_frame").contents().find("body").css("height"));

            $("#note-snapshot").fadeTo(0, 1);

            try {
                html2canvas($("#note-snapshot"), {
                    allowTaint: false,
                    taintTest: false,
                    onrendered: function(canvas) {
                        var dataUrl = canvas.toDataURL("image/png");
                        var data = dataUrl.replace(/^data:image\/png;base64,/,'');

                        self.fileManager.writeFile(saveTo, base64ToBlob(data), function(path, progress, error) {
                            if (error)
                                alert("Unable to write snapshot " + path + "(" + error + ")");
                            else
                                $("#note-snapshot").fadeTo(0, 0);
                            cb && cb();
                        });
                    }
                });
            }
            catch (error) {
                alert("html2canvas: " + error);
                cb && cb();
            }
        }

        /*
         * Grab HTML resources procedure:
         * 1) Find resources with absolute src path on other site (<img src='http://www.somewhere.com/image.jpg'>)
         * 2) Download them to our assets folder
         * 3) Replace resource URL with our assets URL
         */
        function grabResourcesAndSave(notePath, noteIndex, title, content, cb) {
            var re = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/gi;
            var imgs = content.match(re);

            if (imgs && imgs.length > 0) {
                var imgName = self.getTimecode();

                function replaceResource(i) {
                    var src = $(imgs[i]).attr('src');
                    var ext = src.split(".").pop();
                    if (ext) ext = "." + ext;
                    var fileName = (parseInt(imgName) + i).toString() + ext;

                    function handleNextOrSave() {
                        if (i === imgs.length - 1)
                            save(notePath, noteIndex, title, content, cb);
                        else
                            replaceResource(i + 1);
                    }

                    /* Test if resource is from local URL */
                    if (!(new RegExp(/^(userdata)/)).test(src) && !(new RegExp(/^(\/apps\/[bc]\/)/)).test(src)) {
                        self.fileManager.saveUrlAs(dirname(notePath) + "/assets/" + fileName, src, function(path, error) {
                            if (error)
                                console.log("Unable to save file from URL " + src);
                            else
                                content = content.replace(src, "userdata/" + path + (self.storageUUID ? "?sid=" + self.storageUUID : ""));

                            handleNextOrSave();
                        });
                    }
                    else {
                        handleNextOrSave();
                    }
                }

                replaceResource(0);
            }
            else
                save(notePath, noteIndex, title, content, cb);
        }

        self.scheduleAutoSave = function(wait, cb) {
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
                    self.status.savingNote = true;
                    self.jqueryElement.trigger("note-editor.saving");
                    grabResourcesAndSave(notePath, noteIndex, title, content, function() {
                        self.status.savingNote = false;
                        cb && cb();
                    });
                }, wait);
            }
            else {
                /* Rise savingNote to to force coming loadContent()/resetContent() calls to wait */
                self.status.savingNote = true;
                self.jqueryElement.trigger("note-editor.saving");
                grabResourcesAndSave(notePath, noteIndex, title, content, function() {
                    self.status.savingNote = false;
                    cb && cb();
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
            self.scheduleAutoSave(10000);
        });

        editor.on("customsave", function() {
            self.scheduleAutoSave(0);
        });

        editor.on("screenshotarea", function(event) {
            var area = event.data;
            var screenshotId = "screenshot-" + self.getTimecode();

            /* Save a screenshot-area.png copy for this screenshot area in userdata storage */
            self.fileManager.writeFile(
                dirname(self.notePath) + "/assets/" + screenshotId + ".png",
                base64ToBlob(area.image),
                function(path, progress, error) {
                    if (error)
                        console.log("Unable to write screenshot-area.png to " + path + " (error = " + error + ")");
                    else {
                        var screenshotarea = editor.document.getById("new-screenshot-area");
                        screenshotarea.setAttribute("src", "userdata/" + path + (self.storageUUID ? "?sid=" + self.storageUUID : ""));
                        screenshotarea.setAttribute("id", screenshotId);
                    }
                }
            );
        });

        editor.on("maximize", function(state) {
            if (state.data === CKEDITOR.TRISTATE_ON)
                page.navigationBar.hide();
            else
                page.navigationBar.show();
        });

        self.status.editorReady = true;
        self.jqueryElement.trigger("note-editor.ready");
    });
}

NoteEditor.prototype.fitSize = function(width, height) {
    try {
        if (this.config.maxWidth > 0 && width > this.config.maxWidth + 1) {
            /* Set width to (noteEditorMaxWidth + 1) instead of noteEditorMaxWidth due to there's a 1-pixel width right border */
            width = this.config.maxWidth + 1;
            /* Set snapshot width */
            $("#note-snapshot").width(this.config.maxWidth);
        }

        $("#note-title-input").width(width - 7);
        CKEDITOR.instances["note-content-editor"].resize(width, height - 30);
    } catch (e) {}
}

NoteEditor.prototype.loadContent = function(path, index) {
    var self = this;

    if (!self.status.editorReady)
        return;

    /* Wait if we are saving the note */
    if (self.status.savingNote || self.status.flushingNote) {
        /* Last edited note is being saved, defer readFile() work after 500ms and see if it is done */
        setTimeout(function() { self.loadContent(path, index); }, 100);
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
            self.setContentNoLagWorkaround(title, content, function() {
                $("#note-title-input").prop("disabled", false);
                CKEDITOR.instances["note-content-editor"].setReadOnly(false);

                self.notePath = path;
                self.noteIndex = index;
            });
        });
    }
}

NoteEditor.prototype.resetContent = function() {
    var self = this;

    if (!self.status.editorReady)
        return;

    /* Wait if we are saving the note */
    if (self.status.savingNote) {
        /* Last edited note is being saved, defer readFile() work after 500ms and see if it is done */
        setTimeout(function() { self.resetContent(); }, 100);
    }
    else {
        /* Flush unsaved content immediately */
        self.flushContent(function() {
            self.notePath = undefined;
            self.noteIndex = -1;

            self.setContentNoLagWorkaround("", "");

            $("#note-title-input").prop("disabled", true);
            CKEDITOR.instances["note-content-editor"].setReadOnly(true);
        });
    }
}

NoteEditor.prototype.flushContent = function(cb) {
    var self = this;

    if (!self.status.editorReady)
        return;

    /* Wait if we are saving the note */
    if (self.status.savingNote) {
        /* Last edited note is being saved, defer readFile() work after 500ms and see if it is done */
        setTimeout(function() { self.flushContent(cb); }, 100);
    }
    else {
        if (self.notePath) {
            self.status.flushingNote = true;

            /* Stop & clear previous auto save timer */
            if (self.autoSaveTimer) {
                clearTimeout(self.autoSaveTimer);
                self.autoSaveTimer = undefined;
                self.scheduleAutoSave(0, function() {
                    self.removeUselessAssets(self.notePath, 0, function(error) {
                        self.status.flushingNote = false;
                        cb && cb();
                    });
                });
            }
            else {
                self.removeUselessAssets(self.notePath, 0, function(error) {
                    self.status.flushingNote = false;
                    cb && cb();
                });
            }
        }
        else
            cb && cb();
    }
}
