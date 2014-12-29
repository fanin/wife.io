function TextInputDialog(name, dialog, okayText, cancelText) {
    var self = this;

    this.name = name;
    this.checker = [];
    this.dialog = $(dialog);
    this.input = $(dialog + " .dialog-input-name");
    this.tips = $(dialog + " .validate-tips");
    this.doOkay = undefined;
    this.doCancel = undefined;

    var form, allFields = $([]).add(this.input);

    okayText = okayText || "Ok";
    cancelText = cancelText || "Cancel";

    function updateTips(t) {
        self.tips.text(t).addClass("ui-state-highlight");
        setTimeout(function() {
            self.tips.removeClass("ui-state-highlight", 1500);
        }, 300);
    }

    function checkLength(o, n, min, max) {
        if (o.val().length > max || o.val().length < min) {
            o.addClass("ui-state-error");
            updateTips("Length of " + n + " must be between " + min + " and " + max + ".");
            return false;
        } else {
            return true;
        }
    }

    function checkRegexp(o, regexp, n) {
        if (regexp.test(o.val())) {
            o.addClass("ui-state-error");
            updateTips(n);
            return false;
        } else {
            return true;
        }
    }

    function checkOthers(o) {
        for (var i in self.checker) {
            if (self.checker[i].func(o.val())) {
                o.addClass("ui-state-error");
                var msg = self.checker[i].msg.replace(/#name/g, o.val());
                updateTips(msg);
                return false;
            }
        }
        return true;
    }

    this.dialog.dialog({
        autoOpen: false,
        height: 150,
        width: 400,
        modal: true,
        buttons: [
            {
                text: okayText,
                click: create
            },
            {
                text: cancelText,
                click: function() {
                    self.doCancel && self.doCancel();
                    self.tips.text("");
                    self.dialog.dialog("option", "height", 150);
                    self.dialog.dialog("close");
                }
            }
        ],
        close: function() {
            form[0].reset();
            allFields.removeClass("ui-state-error");
        }
    });

    form = this.dialog.find("form").on("submit", function(event) {
        event.preventDefault();
        create();
    });

    function create() {
        var valid = true;
        allFields.removeClass("ui-state-error");

        valid = valid && checkLength(self.input, self.name.toLowerCase() + " name", 2, 32);
        valid = valid && checkRegexp(self.input, /[`~,<>;':"/[\]|{}()=+!@#$%^&*]/, self.name + " should not consist of special characters");
        valid = valid && checkRegexp(self.input, /^(?=-|\.)/, self.name + " name should not begin with character '-' or '.'");
        valid = valid && checkRegexp(self.input, /.*(-|\.)$/, self.name + " name should not end with character '-' or '.'");
        valid = valid && checkOthers(self.input);

        if (valid) {
            self.doOkay && self.doOkay(self.input.val());
            self.tips.text("");
            self.dialog.dialog("option", "height", 150);
            self.dialog.dialog("close");
        }
        else {
            self.dialog.dialog("option", "height", 210);
        }

        return valid;
    }
}

TextInputDialog.prototype.open = function(text) {
    this.dialog.dialog("open");
    if (text) this.input.focus().val(text);
};

TextInputDialog.prototype.close = function() {
    this.dialog.dialog("close");
};

TextInputDialog.prototype.onCreateClick = function(func) {
    this.doOkay = func;
};

TextInputDialog.prototype.onCancelClick = function(func) {
    this.doCancel = func;
};

TextInputDialog.prototype.addCustomCheck = function(func, msg) {
    this.checker.push({ func: func, msg: msg });
};
