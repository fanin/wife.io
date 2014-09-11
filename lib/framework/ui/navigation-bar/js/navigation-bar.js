/*
 * Navigation Bar Button
 */
function NavigationBarButton(text) {
    this.domElement = document.createElement('li');
    this.domAnchor = document.createElement('a');
    this.domElement.appendChild(this.domAnchor);

    if (text) {
        this.domAnchor.appendChild(document.createTextNode(text));
    }
};

NavigationBarButton.prototype.setText = function(text) {
    while (this.domAnchor.firstChild) {
        this.domAnchor.removeChild(this.domAnchor.firstChild);
    }
    this.domAnchor.appendChild(document.createTextNode(text));
};

NavigationBarButton.prototype.setHref = function(href) {
    this.domAnchor.setAttribute('href', href);
};

NavigationBarButton.prototype.setAttribute = function(attr, value) {
    this.domAnchor.setAttribute(attr, value);
};

NavigationBarButton.prototype.setSelected = function(selected) {
    if (selected)
        this.domAnchor.setAttribute('class', 'selected');
    else
        this.domAnchor.setAttribute('class', '');
};


/*
 * Navigation Bar Title
 */
function NavigationBarTitle() {
    this.domElement = document.createElement('li');
    this.domH1 = document.createElement('h1');
    this.domElement.appendChild(this.domH1);
};

NavigationBarTitle.prototype.setText = function(text) {
    this.domH1.appendChild(document.createTextNode(text));
};

NavigationBarTitle.prototype.setAttribute = function(attr, value) {
    this.domH1.setAttribute(attr, value);
};

/*
 * Navigation Bar Label
 */
function NavigationBarLabel(text) {
    this.domElement = document.createElement('li');
    this.domParagraph = document.createElement('p');
    this.domElement.appendChild(this.domParagraph);

    if (text) {
        this.domParagraph.appendChild(document.createTextNode(text));
    }
};

NavigationBarLabel.prototype.setText = function(text) {
    while (this.domParagraph.firstChild) {
        this.domParagraph.removeChild(this.domParagraph.firstChild);
    }
    this.domParagraph.appendChild(document.createTextNode(text));
};

NavigationBarLabel.prototype.setAttribute = function(attr, value) {
    this.domParagraph.setAttribute(attr, value);
};


/*
 * Custom Item
 */
function NavigationBarCustomItem(domElementId) {
    this.domElement = document.getElementById(domElementId);
};

NavigationBarCustomItem.prototype.getElement = function() {
    return this.domElement;
};


/*
 * Navigation Bar Container
 */
function NavigationBarContainer(position) {
    this.domElement = document.createElement('ul');
    this.items = [];

    this.setPosition(position);
};

NavigationBarContainer.prototype.pushItem = function(item) {
    if (item.domElement) {
        this.domElement.appendChild(item.domElement);
        this.items.push(item);
    }
};

NavigationBarContainer.prototype.popItem = function() {
    if (this.items.length > 0) {
        var item = this.items.pop();
        if (item.domElement)
            this.domElement.removeChild(item.domElement);
    }
};

NavigationBarContainer.prototype.removeItem = function(item) {
    var index = this.items.indexOf(item);
    if (index > 0) {
        this.items.splice(index, 1);
        if (item.domElement)
            this.domElement.removeChild(item.domElement);
    }
};

NavigationBarContainer.prototype.setPosition = function(position) {
    if (position == 'left')
        this.domElement.setAttribute('class', 'left-container');
    else if (position == 'center')
        this.domElement.setAttribute('class', 'center-container');
    else if (position == 'right')
        this.domElement.setAttribute('class', 'right-container');
};


/*
 * Navigation Bar
 */
function NavigationBar() {
    this.domElement = document.createElement('nav');
    this.domElement.setAttribute('id', 'nav-bar');

    /* Create containers */
    this.leftContainer = new NavigationBarContainer('left');
    this.centerContainer = new NavigationBarContainer('center');
    this.rightContainer = new NavigationBarContainer('right');

    this.domElement.appendChild(this.leftContainer.domElement);
    this.domElement.appendChild(this.centerContainer.domElement);
    this.domElement.appendChild(this.rightContainer.domElement);
};
