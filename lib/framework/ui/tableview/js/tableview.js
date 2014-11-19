include("lib/framework/ui/tableview/css/tableview.css");

function TableView(view) {
    this.dataSource = undefined;
    this.view = view;
    this.currentNoteIndex = -1;

    this.view.append("<ul></ul>");

    this.bindTableRowEvents = function(container, index) {
        var self = this;
        container.unbind("click");
        container.click(function() {
            self.selectRowAtIndex(index);
        });

        container.off("contextmenu");
        container.on("contextmenu", function (event) {
            self.view.trigger("tableview.contextmenu", { event: event, element: container, index: index });
            return false;
        });

        container.off('hover');
        container.hover(
            function() {
                container.addClass("hovered");
            },
            function() {
                container.removeClass("hovered");
            }
        );
    };
}

TableView.prototype.show = function() {
    var self = this;
    var i;
    var rows = self.dataSource.tableViewNumberOfRows();

    if (rows <= 0 && self.currentNoteIndex >= 0)
        self.deselectRowAtIndex(self.currentNoteIndex);

    self.view.find("ul").empty();

    if (rows <= 0) { self.currentNoteIndex = -1; return }
    if (rows > 0) self.currentNoteIndex = 0;

    for (i = 0; i < rows; i++) {
        self.view.find("ul").append("<li></li>");
        self.dataSource.tableViewCellForRowAtIndex(i, function(cell, index) {
            var rowContainer = self.view.find("ul").find("li").eq(index);
            rowContainer.empty();
            rowContainer.append(cell);
            self.bindTableRowEvents(rowContainer, index);
        });
    }

    self.selectRowAtIndex(0);

    self.view.trigger("tableview.show");
}

TableView.prototype.hide = function() {
    var self = this;
    self.view.find("ul").hide();
    self.view.trigger("tableview.hide");
}

TableView.prototype.reload = function() {
    this.show();
}

TableView.prototype.reloadRowAtIndex = function(index, complete) {
    var self = this;

    self.dataSource.tableViewCellForRowAtIndex(index, function(cell, index) {
        var rowContainer = self.view.find("ul").find("li").eq(index);
        if (rowContainer) {
            rowContainer.empty();
            rowContainer.append(cell);
            self.bindTableRowEvents(rowContainer, index);
        }
        if (complete) complete();
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

TableView.prototype.insertRowAtIndex = function(index, complete) {
    var self = this;
    var rows = self.dataSource.tableViewNumberOfRows();

    if (rows === 1) {
        self.view.find("ul").append("<li></li>");
    } else if (index >= 0 && index <= rows) {
        self.view.find("ul").find("li").eq(index).before("<li></li>");
    }
    else return;

    self.dataSource.tableViewCellForRowAtIndex(index, function(cell, index) {
        var rowContainer = self.view.find("ul").find("li").eq(index);
        if (rowContainer) {
            rowContainer.empty();
            rowContainer.append(cell);
            self.bindTableRowEvents(rowContainer, index);
        }

        if (index <= self.currentNoteIndex)
            ++self.currentNoteIndex;

        for (var i = index + 1; i < rows; i++)
            self.reloadRowAtIndex(i);

        if (complete) complete();
    });
}

TableView.prototype.removeRowAtIndex = function(index, complete) {
    var self = this;
    var rows = self.dataSource.tableViewNumberOfRows();

    if (rows === 0) {
        self.deselectRowAtIndex(index);
        self.view.find("ul").empty();
        return;
    }

    if (self.currentNoteIndex !== index)
        self.deselectRowAtIndex(self.currentNoteIndex);

    var rowContainer = self.view.find("ul").find("li").eq(index);
    if (rowContainer)
        rowContainer.remove();

    for (var i = index; i < rows; i++)
        self.reloadRowAtIndex(i);

    self.selectRowAtIndex(index);

    if (complete) complete();
}
