include("lib/framework/ui/tableview/css/tableview.css");

function TableView(_super, view) {
    this.delegate = _super;
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
            self.view.find("ul").find("li").eq(index).append(cell);

            self.view.find("ul").find("li").eq(index).click(function() {
                self.selectRowAtIndex(index);
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

TableView.prototype.selectRowAtIndex = function(index) {
    var self = this;
    var cell = self.view.find("ul").find("li").eq(index);

    if (!cell) return;

    if (!cell.hasClass("selected")) {
        if (self.currentNoteIndex >= 0) {
            self.view.find("ul").find("li").eq(self.currentNoteIndex).removeClass("selected");
            self.delegate.tableViewDidDeselectRowAtIndex(self.currentNoteIndex);
        }
        self.currentNoteIndex = index;
        cell.addClass("selected");
        self.delegate.tableViewDidSelectRowAtIndex(index);
    }
}

TableView.prototype.deselectRowAtIndex = function(index) {
    var self = this;
    var cell = self.view.find("ul").find("li").eq(index);

    if (!cell) return;

    if (cell.hasClass("selected")) {
        self.view.find("ul").find("li").eq(self.currentNoteIndex).removeClass("selected");
        self.delegate.tableViewDidDeselectRowAtIndex(self.currentNoteIndex);
        self.currentNoteIndex = -1;
    }
}
