include("lib/framework/ui/dialog/css/dialog.css");

/**
 * JQuery UI Dialog
 */

function Dialog(view, type, modal) {
    this.jqueryElement = $("#" + view);
    this.type = type || "default";
    this.modal = modal;

    if (this.modal === undefined) this.modal = true;

    var domDialogLabel = document.createElement("div");
    domDialogLabel.setAttribute("class", "dialog-message");
    this.jqueryElement.append(domDialogLabel);

    if (type === "progress") {
        var domProgreeBar = document.createElement("div");
        domProgreeBar.setAttribute("id", "progressbar");
        this.jqueryElement.append(domProgreeBar);
    }

    this.jqueryElement.dialog({
        modal: this.modal,
        autoOpen: false,
        closeOnEscape: false,
        resizable: false
    });
};

Dialog.prototype.setTitle = function(title) {
    this.jqueryElement.dialog("option", "title", title);
};

Dialog.prototype.setMessage = function(message) {
    $(".dialog-message").text(message);
};

Dialog.prototype.setProgress = function(progress) {
    $("#progressbar").progressbar("value", progress);
};

Dialog.prototype.progress = function() {
    return $("#progressbar").progressbar("value");
};

Dialog.prototype.setButton = function(buttons) {
    this.jqueryElement.dialog("option", "buttons", buttons);
};

Dialog.prototype.setButtonEnable = function(index, enable) {
    var button = $(".ui-dialog-buttonset").find("button").eq(index);

    if (button) {
        if (enable)
            button.attr("disabled", false).removeClass('ui-state-disabled');
        else
            button.attr("disabled", true).addClass('ui-state-disabled');
    }
};

Dialog.prototype.setButtonFocus = function(index) {
    var button = $(".ui-dialog-buttonset").find("button").eq(index);
    button.focus();
};

Dialog.prototype.show = function() {
    this.jqueryElement.dialog("open");
};

Dialog.prototype.hide = function() {
    this.jqueryElement.dialog("close");
};

Dialog.prototype.onDialogEvent = function(event) {
    if (event.open) this.jqueryElement.dialog("option", "open", event.open);
    if (event.beforeClose) this.jqueryElement.dialog("option", "beforeClose", event.beforeClose);
    if (event.close) this.jqueryElement.dialog("option", "close", event.close);
};

Dialog.prototype.onProgressEvent = function(event) {
    $("#progressbar").progressbar({
        value: false,
        change: event.change,
        complete: event.complete
    });
};
