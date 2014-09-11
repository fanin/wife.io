function Page() {
    this.navigationBar = undefined;
};

Page.prototype.createNavigationBar = function(title) {
    this.navigationBar = new NavigationBar();

    /* Left container */
    var navigationBarHomeButton = new NavigationBarButton();
    navigationBarHomeButton.setText("HOME");
    navigationBarHomeButton.setHref("http://%SYSIP%:8001");
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
