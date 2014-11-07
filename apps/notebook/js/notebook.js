function Notebook(fileManager) {
    this.notePaths = undefined;
    this.fileManager = fileManager;
    this.tableView = new TableView(this, $("#notes"));

    /* Build real path from node or string */
    this.getPath = function(node) {
        var path = "";

        if (typeof node === "object")
            path = "/" + node.name;
        else if (typeof node === "string")
            path = node;

        return "bookshelf" + path;
    }

    this.listenToEvents = function() {
        var self = this;

        $("#notebook").off("refresh");
        $("#notebook").on("refresh", function(event, index) {
            self.tableView.reloadRowAtIndex(index);
        });

        self.tableView.view.off("contextmenu");
        self.tableView.view.on("contextmenu", function(event, index) {
            alert("show menu at " + index);
        });

        self.tableView.view.off("tableview.select");
        self.tableView.view.on("tableview.select", function(event, index) {
            $("#notebook").trigger("select", { path: self.notePaths[index] + "/main.html", index: index });
        });

        self.tableView.view.off("tableview.deselect");
        self.tableView.view.on("tableview.deselect", function(event, index) {
            $("#notebook").trigger("deselect", { index: index });
        });
    }
}

extend(Notebook.prototype, TableViewDataSource.prototype);

Notebook.prototype.fitSize = function(width, height) {
    $("#notebook-name").width(width * 0.2);
    $("#notes").width(width * 0.2);
    $("#notes").height(height - 29);
}

Notebook.prototype.open = function(node) {
    var self = this;

    self.notePaths = [];

    $("#notebook-name").find("span").remove();
    if (node.isFolder())
        $("#notebook-name").append("<span><i class='fa fa-list'></i>&nbsp;" + node.name + "</span>");
    else
        $("#notebook-name").append("<span><i class='fa fa-book'></i>&nbsp;" + node.name + "</span>");

    if (node.isFolder()) {
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            self.fileManager.iterateList(
                self.getPath(child),
                function(path, item, i, error) {
                    if (error)
                        console.log("Unable to list " + path + "/" + item);
                    else
                        self.notePaths.push(path + "/" + item);
                },
                function(path) {
                    self.tableView.show();
                }
            );
        }
    }
    else {
        self.fileManager.iterateList(
            self.getPath(node),
            function(path, item, i, error) {
                if (error)
                    console.log("Unable to list " + path + "/" + item);
                else
                    self.notePaths.push(path + "/" + item);
            },
            function(path) {
                self.tableView.show();
            }
        );
    }

    self.listenToEvents();
}

Notebook.prototype.tableViewNumberOfRows = function() {
    return this.notePaths.length;
}

Notebook.prototype.tableViewCellForRowAtIndex = function(index, appendDivToTableRow) {
    var self = this;
    var defaultDiv = $("<div></div>");

    self.fileManager.readFile(self.notePaths[index] + "/main.html", "utf8", function(path, data, error) {
        if (error) {
            console.log("Unable to read " + self.notePaths[index] + "/main.html");
            appendDivToTableRow(defaultDiv, index);
            return;
        }

        appendDivToTableRow("<div>" + $("<div></div>").append(data).find("title").text() + "</div>", index);
    });
}
