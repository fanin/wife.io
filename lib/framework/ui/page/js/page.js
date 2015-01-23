extend(Page.prototype, Event.prototype);

function Page() {
    var self = this;
    this.navigationBar = undefined;
    this.notifier = new Notifier();

    /* Disallow drag & drop file to page */
    $(document).bind('drop dragover', function (e) {
        e.preventDefault();
    });

    /* Listen to global notifications */
    this.event.on("storage.notification#diskinsert", function(event, disk) {
        self.notifier.add("Disk added", "A disk is inserted and mounted at " + disk.mountpoint, "/apps/b/storage/img/icon.png", 5000);
    });

    this.event.on("storage.notification#diskremove", function(event, disk) {
        self.notifier.add("Disk removed", "Disk which was mounted at " + disk.mountpoint + " is removed", "/apps/b/storage/img/icon.png", 5000);
    });

    this.event.on("storage.notification#error", function(event, error) {
        if (error === "ERROR-STOR-NO-USER-DISK")
            self.notifier.add("Storage Error", "No internal user storage found", "/apps/b/storage/img/icon.png", 0);
        else
            self.notifier.add("Storage Error", error, "/apps/b/storage/img/icon.png", 0);
    });
};

Page.prototype.createNavigationBar = function(title) {
    this.navigationBar = new NavigationBar();

    /* Left container */
    var navigationBarHomeButton = new NavigationBarButton();
    navigationBarHomeButton.setText("HOME");
    navigationBarHomeButton.setHref("http://%SYSIP%:%SYSPORT%");
    navigationBarHomeButton.setSelected(true);
    this.navigationBar.leftContainer.pushItem(navigationBarHomeButton);

    /* Center container */
    var navigationBarTitle = new NavigationBarTitle();
    navigationBarTitle.setText(title);
    this.navigationBar.centerContainer.pushItem(navigationBarTitle);

    document.body.appendChild(this.navigationBar.domElement);
};

Page.prototype.setTitle = function(text) {
    document.title = text;
};

Page.prototype.setFooterText = function(text) {
    var footer = document.getElementById("footer");
    if (footer) {
        footer.appendChild(document.createTextNode(text));
    }
};

Page.prototype.appendFooterElement = function(element) {
    var footer = document.getElementById("footer");
    if (footer) {
        footer.appendChild(element);
    }
};
