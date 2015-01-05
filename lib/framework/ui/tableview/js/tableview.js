include("lib/framework/ui/tableview/css/tableview.css");

function TableView(view) {
    this.dataSource = undefined;
    this.view = view;
    this.selectedIndex = -1;
    this.lock = false;

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

    /* Reload row at index without lock */
    this.reloadRowAtIndexNoLock = function(index, complete) {
        var self = this;
        self.dataSource.tableViewCellForRowAtIndex(index, function(cell, index) {
            if (cell) {
                var rowContainer = self.view.find("ul").find("li").eq(index);
                if (rowContainer) {
                    rowContainer.empty();
                    rowContainer.append(cell);
                    self.bindTableRowEvents(rowContainer, index);
                }
            }
            complete && complete();
        });
    };
}

TableView.prototype.show = function() {
    var self = this;

    if (self.lock) {
        setTimeout(function() { self.show(); }, 200);
        return;
    }

    self.lock = true;

    var rows = self.dataSource.tableViewNumberOfRows();

    if (rows <= 0 && self.selectedIndex >= 0) {
        self.deselectRowAtIndex(self.selectedIndex);
    }

    self.view.find("ul").empty();

    if (rows <= 0) {
        self.selectedIndex = -1;
        self.view.trigger("tableview.show");
        self.lock = false;
        return;
    }

    if (rows > 0) self.selectedIndex = 0;

    function recursivelyShowTableViewCell(row) {
        self.view.find("ul").append("<li></li>");
        self.dataSource.tableViewCellForRowAtIndex(row, function(cell, index) {
            if (!cell) {
                self.lock = false;
                return;
            }

            var rowContainer = self.view.find("ul").find("li").eq(index);
            rowContainer.empty();
            rowContainer.append(cell);
            self.bindTableRowEvents(rowContainer, index);

            if (row === 0)
                self.selectRowAtIndex(0);

            if (index === rows - 1) {
                self.view.trigger("tableview.show");
                self.lock = false;
            }
            else {
                recursivelyShowTableViewCell(row + 1);
            }
        });
    }

    recursivelyShowTableViewCell(0);
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

    if (self.lock) {
        setTimeout(function() { self.reloadRowAtIndex(index, complete); }, 200);
        return;
    }

    self.lock = true;

    self.reloadRowAtIndexNoLock(index, function() {
        self.lock = false;
        complete && complete();
    });
}

TableView.prototype.selectRowAtIndex = function(index) {
    var self = this;
    var rowContainer = self.view.find("ul").find("li").eq(index);

    if (!rowContainer) return;

    if (!rowContainer.hasClass("selected")) {
        if (self.selectedIndex >= 0 && self.selectedIndex < self.dataSource.tableViewNumberOfRows()) {
            self.view.find("ul").find("li").eq(self.selectedIndex).removeClass("selected");
            self.view.trigger("tableview.deselect", self.selectedIndex);
        }
        self.selectedIndex = index;
        rowContainer.addClass("selected");
        self.view.trigger("tableview.select", index);
    }
}

TableView.prototype.deselectRowAtIndex = function(index) {
    var self = this;
    var rowContainer = self.view.find("ul").find("li").eq(index);

    if (!rowContainer) return;

    if (rowContainer.hasClass("selected")) {
        self.view.find("ul").find("li").eq(self.selectedIndex).removeClass("selected");
        self.view.trigger("tableview.deselect", self.selectedIndex);
        self.selectedIndex = -1;
    }
}

TableView.prototype.insertRowAtIndex = function(index, complete) {
    var self = this;
    var rows = self.dataSource.tableViewNumberOfRows();

    if (self.lock) {
        setTimeout(function() { self.insertRowAtIndex(index, complete); }, 200);
        return;
    }

    self.lock = true;

    if (rows === 1) {
        self.view.find("ul").append("<li></li>");
    } else if (index >= 0 && index <= rows) {
        self.view.find("ul").find("li").eq(index).before("<li></li>");
    }
    else {
        self.lock = false;
        return;
    }

    self.dataSource.tableViewCellForRowAtIndex(index, function(cell, index) {
        if (!cell) {
            self.lock = false;
            complete && complete("ERROR");
            return;
        }

        var rowContainer = self.view.find("ul").find("li").eq(index);
        if (rowContainer) {
            rowContainer.empty();
            rowContainer.append(cell);
            self.bindTableRowEvents(rowContainer, index);
        }

        if (index <= self.selectedIndex)
            ++self.selectedIndex;

        for (var i = index + 1; i < rows; i++)
            self.reloadRowAtIndexNoLock(i);

        self.lock = false;
        complete && complete();
    });
}

TableView.prototype.removeRowAtIndex = function(index, complete) {
    var self = this;
    var rows = self.dataSource.tableViewNumberOfRows();

    if (self.lock) {
        setTimeout(function() { self.removeRowAtIndex(index, complete); }, 200);
        return;
    }

    self.lock = true;

    if (rows === 0) {
        self.deselectRowAtIndex(index);
        self.view.find("ul").empty();
        self.lock = false;
        return;
    }

    if (self.selectedIndex !== index)
        self.deselectRowAtIndex(self.selectedIndex);

    var rowContainer = self.view.find("ul").find("li").eq(index);
    if (rowContainer)
        rowContainer.remove();

    for (var i = index; i < rows; i++)
        self.reloadRowAtIndexNoLock(i);

    self.selectRowAtIndex(index);
    self.lock = false;

    complete && complete();
}
