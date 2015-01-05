function NoteEditor(viewController, config) {
    var self = this;

    self.noteTitle = "";
    self.noteContent = "";
    self.noteObject = undefined;
    self.fileManager = viewController.fileManagerClient;
    self.jqueryElement = $("#note-editor");
    self.autoSaveTimer = undefined;
    self.status = {
        editorReady: false,
        dirty: false,
        busy: false,
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
    CKEDITOR.config.skin = "icy_orange";
    CKEDITOR.addCss(".cke_editable { word-wrap: break-word }");
    CKEDITOR.replace("note-content-editor");

    CKEDITOR.on("instanceReady", function(event) {
        var editor = event.editor;

        function replaceQueryString(url, param, value) {
            var re = new RegExp("([?|&])" + param + "=.*?(&|$|\")","ig");
            if (url.match(re))
                return url.replace(re,'$1' + param + "=" + value + '$2');
            else
                return url;
        }

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
                /* Replace disk uuid of all query string in the content if the uuid is fake (generated by core-server) */
                content = replaceQueryString(content, "uuid", self.storageUUID);
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
                                     * To access file in userdata, the url must contain a query string 'uuid=xxx'
                                     * to specify the storage where the file is laid on.
                                     */
                                    "<img src='userdata/" + path + (self.storageUUID ? "?uuid=" + self.storageUUID : "") +
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

            var path = dirname(self.noteObject.path) + "/assets";
            var files = e.data.$.target.files || e.data.$.dataTransfer.files;

            uploadImages(path, files);
            self.fileManager.touch(path, function() {});
        }

        function dragoverEffect(e) {
            e.data.preventDefault();
            if (editor.readOnly) return;
        }

        /**
         * The last step of saving note procedure:
         * 1) Build full note document with title and content
         * 2) Write note to file
         * 3) Generate latest note summary
         * 4) Update latest modified date (touch)
         * 5) Take note snapshot image if snapshot function enabled
         */
        function __save(noteObject, title, content, cb) {
            if (!noteObject || !noteObject.path) {
                cb && cb("Inavlid Path");
                self.jqueryElement.trigger("noteEditor.saveWithError", noteObject);
                return;
            }

            if (!title || title.trim() === "")
                title = "Untitled";

            var doc = "<html><head><title>" + title + "</title></head><body>" + content + "</body></html>";

            if (self.noteTitle === title && self.noteContent === content) {
                self.status.dirty = false;
                self.jqueryElement.trigger("noteEditor.saveWithoutChange", noteObject);
                cb && cb();
                return;
            }

            self.fileManager.writeFile(noteObject.path, doc, function(path, progress, error) {
                if (error) {
                    cb && cb(error);
                    console.log("Unable to write " + path);
                    return;
                }

                /* Update note-summary.json */
                updateNoteSummary(dirname(noteObject.path), title, content);

                /* Update last modified time */
                self.fileManager.touch(dirname(noteObject.path), function(path, error) {
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
                            self.status.dirty = false;
                            cb && cb();
                            self.jqueryElement.trigger("noteEditor.afterSave", noteObject);
                        });
                    }
                    else {
                        self.status.dirty = false;
                        cb && cb();
                        self.jqueryElement.trigger("noteEditor.afterSave", noteObject);
                    }
                });
            });
        }

        /**
         * Overwrite note-summary.json
         * 1) Add basic info into summary (i.e: title)
         * 2) Find screenshot area in the note if any, and get the area info into summary
         * 3) Sort screenshot area info by y-position
         * 4) Write summary to note-summary.json
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
        function grabResources(noteObject, content, cb) {
            var re = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/gi;
            var imgs = content.match(re);

            if (imgs && imgs.length > 0) {
                var imgName = self.getTimecode();

                function replaceResource(i) {
                    var src = $(imgs[i]).attr('src');
                    var ext = src.split(".").pop().split("?")[0];
                    if (ext) ext = "." + ext;
                    var fileName = (parseInt(imgName) + i).toString() + ext;

                    function grabNext() {
                        if (i === imgs.length - 1)
                            cb && cb(content);
                        else
                            replaceResource(i + 1);
                    }

                    /* Test if resource is from local URL, if note, download it to userdata */
                    if (!(new RegExp(/^(userdata)/)).test(src) && !(new RegExp(/^(\/apps\/[bc]\/)/)).test(src)) {
                        self.jqueryElement.trigger("noteEditor.grabResources", fileName);
                        self.fileManager.saveUrlAs(dirname(noteObject.path) + "/assets/" + fileName, src, function(path, error) {
                            if (error)
                                console.log("Unable to save file from URL " + src);
                            else
                                content = content.replace(new RegExp(src, 'g'), "userdata/" + path + (self.storageUUID ? "?uuid=" + self.storageUUID : ""));

                            grabNext();
                        });
                    }
                    else {
                        grabNext();
                    }
                }

                replaceResource(0);
            }
            else
                cb && cb(content);
        }

        /**
         * The common entry of save function
         */
        self.save = function(cb) {
            self.jqueryElement.trigger("noteEditor.beforeSave");

            var title = $("#note-title-input").val();
            var content = editor.getData();

            grabResources(self.noteObject, content, function(replacement) {
                __save(self.noteObject, title, replacement, cb);
            });
        }

        /**
         * When user upload an image and remove it from the note, the image file is still under assets folder.
         * We scan note and remove unused assets after user complete editing note.
         */
        self.removeUselessAssets = function(noteObject, after, cb) {
            setTimeout(function() {
                self.fileManager.list(
                    dirname(noteObject.path) + "/assets",
                    function(path, items, error) {
                        if (error) {
                            console.log("Unable to list " + path);
                            cb && cb(error);
                            return;
                        }

                        function removeUseless(i) {
                            self.fileManager.grep(noteObject.path, items[i], null, function(path, data, error) {
                                if (error) {
                                    console.log("Unable to read " + path);
                                    cb && cb(error);
                                    return;
                                }

                                if (!data) {
                                    self.fileManager.remove(dirname(noteObject.path) + "/assets/" + items[i], function(path, error) {
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

        var editorChangeHandler = function() {
            self.status.dirty = true;

            if (self.autoSaveTimer) {
                clearTimeout(self.autoSaveTimer);
                self.autoSaveTimer = undefined;
            }

            self.autoSaveTimer = setTimeout(function() {
                self.autoSaveTimer = undefined;
                self.status.busy = true;
                self.save(function() { self.status.busy = false; });
            }, 10000);
        }

        var editorSaveHandler = function() {
            if (self.autoSaveTimer) {
                clearTimeout(self.autoSaveTimer);
                self.autoSaveTimer = undefined;
            }
            self.status.busy = true;
            self.save(function() { self.status.busy = false; });
        }

        $("#note-title-input").on('change keyup paste', function() {
            /* Ignore the change event which is fired by setContentNoLagWorkaround */
            if (!self.status.busy)
                editorChangeHandler();
        });

        $("#note-title-input").focusout(function() {
            editorSaveHandler();
        });

        editor.on("contentDom", function() {
            // For Firefox/Chrome
            editor.document.on("drop", dropFiles);
            editor.document.on("dragover", dragoverEffect);
            // For IE
            //editor.document.getBody().on("drop", dropFiles);
            //editor.document.getBody().on("dragover", dragoverEffect);

            editor.focus();
        });

        editor.on("paste", function(event) {
            event.stop();
            var data = event.data.dataValue;
            /* Remove single &nbsp; between tags on paste to prevent problems from ckeditor parsing the html content */
            event.editor.insertHtml(data.replace(/\>&nbsp;\</gi,'\>\<'));
            editorChangeHandler();
        });

        editor.on("change", function() {
            /* Ignore the change event which is fired by setContentNoLagWorkaround */
            if (!self.status.busy)
                editorChangeHandler();
        });

        editor.on("customsave", function() {
            editorSaveHandler();
        });

        editor.on("screenshotarea", function(event) {
            var area = event.data;
            var screenshotId = "screenshot-" + self.getTimecode();

            /* Save a screenshot-area.png copy for this screenshot area in userdata storage */
            self.fileManager.writeFile(
                dirname(self.noteObject.path) + "/assets/" + screenshotId + ".png",
                base64ToBlob(area.image),
                function(path, progress, error) {
                    if (error)
                        console.log("Unable to write screenshot-area.png to " + path + " (error = " + error + ")");
                    else {
                        var screenshotarea = editor.document.getById("new-screenshot-area");
                        screenshotarea.setAttribute("src", "userdata/" + path + (self.storageUUID ? "?uuid=" + self.storageUUID : ""));
                        screenshotarea.setAttribute("id", screenshotId);
                    }
                }
            );
        });

        editor.on("maximize", function(state) {
            if (state.data === CKEDITOR.TRISTATE_ON)
                self.jqueryElement.trigger("noteEditor.uiMaximize");
            else
                self.jqueryElement.trigger("noteEditor.uiNormalize");
        });

        self.status.editorReady = true;
        self.jqueryElement.trigger("noteEditor.uiReady");
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

NoteEditor.prototype.loadContent = function(noteObject) {
    var self = this;

    if (!self.status.editorReady)
        return;

    /* Wait if editor is busy loading or saving the note */
    if (self.status.busy) {
        /* Last edited note is being saved, defer readFile() work after 500ms and see if it is done */
        setTimeout(function() { self.loadContent(noteObject); }, 100);
    }
    else {
        self.status.busy = true;

        self.fileManager.readFile(noteObject.path, "utf8", function(path, data, error) {
            if (error) {
                console.log("Unable to read " + path);
                self.status.busy = false;
                return;
            }

            /* Extract and show title text */
            var title = $("<div></div>").append(data).find("title").text() || "";
            /* Remove all single &nbsp between tags and extract and show contents inside <body></body> on CKEDITOR */
            var content = data.replace(/\>&nbsp;\</gi,'\>\<').match(/\<body[^>]*\>([^]*)\<\/body/m)[1] || "";
            self.setContentNoLagWorkaround(title, content, function() {
                $("#note-title-input").prop("disabled", false);
                CKEDITOR.instances["note-content-editor"].setReadOnly(false);

                self.noteObject = noteObject;
                self.status.busy = false;
            });
        });
    }
}

NoteEditor.prototype.resetContent = function() {
    var self = this;

    if (!self.status.editorReady)
        return;

    /* Wait if editor is busy loading or saving the note */
    if (self.status.busy) {
        /* Last edited note is being saved, defer readFile() work after 500ms and see if it is done */
        setTimeout(function() { self.resetContent(); }, 100);
    }
    else {
        self.status.busy = true;
        self.status.dirty = false;
        self.noteObject = null;

        $("#note-title-input").prop("disabled", true);
        CKEDITOR.instances["note-content-editor"].setReadOnly(true);

        self.setContentNoLagWorkaround("", "", function() {
            self.status.busy = false;
        });
    }
}

NoteEditor.prototype.flushContent = function(cb) {
    var self = this;

    if (!self.status.editorReady)
        return;

    /* Wait if editor is busy loading or saving the note */
    if (self.status.busy) {
        /* Last edited note is being saved, defer readFile() work after 500ms and see if it is done */
        setTimeout(function() { self.flushContent(cb); }, 100);
    }
    else {
        self.status.busy = true;

        if (self.status.dirty && self.noteObject) {
            /* Stop & clear previous auto save timer */
            if (self.autoSaveTimer) {
                clearTimeout(self.autoSaveTimer);
                self.autoSaveTimer = undefined;
                self.save(function() {
                    self.removeUselessAssets(self.noteObject, 0, function(error) {
                        cb && cb();
                        self.status.busy = false;
                    });
                });
            }
            else {
                self.removeUselessAssets(self.noteObject, 0, function(error) {
                    self.status.busy = false;
                    cb && cb();
                });
            }
        }
        else if (self.noteObject) {
            self.removeUselessAssets(self.noteObject, 0, function(error) {
                self.status.busy = false;
                cb && cb();
            });
        }
        else {
            self.status.busy = false;
            cb && cb();
        }
    }
}
