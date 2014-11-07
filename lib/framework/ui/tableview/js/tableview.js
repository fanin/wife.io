include("lib/framework/ui/tableview/css/tableview.css");

function TableView(_super, view) {
    this.dataSource = _super;
    this.view = view;
    this.currentNoteIndex = -1;

    this.view.append("<ul></ul>");
}

TableView.prototype.show = function() {
    var self = this;
    var i;
    var rows = self.dataSource.tableViewNumberOfRows();

    self.view.find("ul").empty();

    if (rows <= 0)
        return;

    if (rows > 0)
        self.currentNoteIndex = 0;

    for (i = 0; i < rows; i++) {
        self.view.find("ul").append("<li></li>");
        self.dataSource.tableViewCellForRowAtIndex(i, function(cell, index) {
            self.view.find("ul").find("li").eq(index).empty();
            self.view.find("ul").find("li").eq(index).append(cell);

            self.view.find("ul").find("li").eq(index).unbind('click');
            self.view.find("ul").find("li").eq(index).click(function() {
                self.selectRowAtIndex(index);
            });

            self.view.find("ul").find("li").eq(index).off("contextmenu");
            self.view.find("ul").find("li").eq(index).on("contextmenu", function () {
                self.view.trigger("tableview.contextmenu", index);
                return false;
            });
        });
    }

    self.selectRowAtIndex(0);
}

TableView.prototype.hide = function() {
    var self = this;
    self.view.find("ul").hide();
}

TableView.prototype.reload = function() {
    this.show();
}

TableView.prototype.reloadRowAtIndex = function(index) {
    var self = this;

    self.dataSource.tableViewCellForRowAtIndex(index, function(cell, index) {
        var rowContainer = self.view.find("ul").find("li").eq(index);
        if (rowContainer) {
            rowContainer.empty();
            rowContainer.append(cell);
        }
    });
}

TableView.prototype.selectRowAtIndex = function(index) {
    var self = this;
    var rowContainer = self.view.find("ul").find("li").eq(index);

    if (!rowContainer) return;

    if (!rowContainer.hasClass("selected")) {
        if (self.currentNoteIndex >= 0) {
            self.view.find("ul").find("li").eq(self.currentNoteIndex).removeClass("selected");
            self.view.trigger("tableview.deselect", self.currentNoteIndex);
        }
        self.currentNoteIndex = index;
        rowContainer.addClass("selected");
        self.view.trigger("tableview.select", index);
    }
}

TableView.prototype.deselectRowAtIndex = function(index) {
    var self = this;
    var cell = self.view.find("ul").find("li").eq(index);

    if (!cell) return;

    if (cell.hasClass("selected")) {
        self.view.find("ul").find("li").eq(self.currentNoteIndex).removeClass("selected");
        self.view.trigger("tableview.deselect", self.currentNoteIndex);
        self.currentNoteIndex = -1;
    }
}
