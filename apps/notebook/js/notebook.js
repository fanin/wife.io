function Notebook(fileManager) {
    this.notes = undefined;;
    this.node = null;
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
}

extend(Notebook.prototype, TableViewDelegate.prototype);
extend(Notebook.prototype, TableViewDataSource.prototype);

Notebook.prototype.fitSize = function(width, height) {
    $("#notebook-name").width(width * 0.2);
    $("#notes").width(width * 0.2);
    $("#notes").height(height - 29);
}

Notebook.prototype.open = function(node) {
    var self = this;

    self.node = node;

    $("#notebook-name").find("span").remove();
    if (node.isFolder())
        $("#notebook-name").append("<span><i class='fa fa-list'></i>&nbsp;" + node.name + "</span>");
    else
        $("#notebook-name").append("<span><i class='fa fa-book'></i>&nbsp;" + node.name + "</span>");

    if (node.isFolder()) {
        //TODO
    }
    else {
        self.fileManager.list(self.getPath(node), function(path, items, error) {
            if (error) {
                console.log("Unable to list " + path);
                return;
            }

            self.notes = items;
            self.tableView.show();
        });
    }
}

Notebook.prototype.tableViewNumberOfRows = function() {
    return this.notes.length;
}

Notebook.prototype.tableViewCellForRowAtIndex = function(index, appendDivToTableRow) {
    var self = this;
    var defaultDiv = $("<div></div>");

    self.fileManager.readFile(self.getPath(self.node) + "/" + self.notes[index] + "/main.html", "utf8", function(path, data, error) {
        if (error) {
            console.log("Unable to read " + path + "/" + self.notes[index] + "/main.html");
            appendDivToTableRow(defaultDiv, index);
            return;
        }

        appendDivToTableRow("<div>" + $("<div></div>").append(data).find("title").text() + "</div>", index);
    });
}

Notebook.prototype.tableViewDidSelectRowAtIndex = function(index) {

}

Notebook.prototype.tableViewDidDeselectRowAtIndex = function(index) {

}
