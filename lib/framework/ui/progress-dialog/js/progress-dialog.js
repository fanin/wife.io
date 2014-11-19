include("lib/framework/ui/progress-dialog/css/progress-dialog.css");

/**
 * Progress Dialog (using JQuery UI)
 */

function ProgressDialog() {
    var domDialogLabel = document.createElement("div");
    var domProgreeBar = document.createElement("div");

    domDialogLabel.setAttribute("class", "progress-label");
    domProgreeBar.setAttribute("id", "progressbar");

    this.domElement = document.getElementById("progress-dialog");
    this.domElement.appendChild(domDialogLabel);
    this.domElement.appendChild(domProgreeBar);

    $("#progress-dialog").dialog({
        autoOpen: false,
        closeOnEscape: false,
        resizable: false
    });
};

ProgressDialog.prototype.setTitle = function(title) {
    $("#progress-dialog").dialog("option", "title", title);
};

ProgressDialog.prototype.setMessage = function(message) {
    $(".progress-label").text(message);
};

ProgressDialog.prototype.setProgress = function(progress) {
    $("#progressbar").progressbar("value", progress);
};

ProgressDialog.prototype.progress = function() {
    return $("#progressbar").progressbar("value");
};

ProgressDialog.prototype.setButton = function(title, click) {
    $("#progress-dialog").dialog("option", "buttons", [{
        text: title,
        click: click
    }]);
};

ProgressDialog.prototype.setButtonEnable = function(enable) {
    if (enable)
        $(".ui-dialog button").attr("disabled", false).removeClass('ui-state-disabled');
    else
        $(".ui-dialog button").attr("disabled", true).addClass('ui-state-disabled');
};

ProgressDialog.prototype.setButtonFocus = function() {
    $(".ui-dialog button").last().focus();
};

ProgressDialog.prototype.show = function() {
    $("#progress-dialog").dialog("open");
};

ProgressDialog.prototype.hide = function() {
    $("#progress-dialog").dialog("close");
};

ProgressDialog.prototype.onDialogEvent = function(event) {
    if (event.open) $("#progress-dialog").dialog("option", "open", event.open);
    if (event.beforeClose) $("#progress-dialog").dialog("option", "beforeClose", event.beforeClose);
    if (event.close) $("#progress-dialog").dialog("option", "close", event.close);
};

ProgressDialog.prototype.onProgressEvent = function(event) {
    $("#progressbar").progressbar({
        value: false,
        change: event.change,
        complete: event.complete
    });
};
