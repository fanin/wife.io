"use strict";

var InputModalViewController = React.createClass({

    propTypes: {
        identifier: React.PropTypes.string.isRequired
    },

    getDefaultProps: function() {
        return {
            title: "",
            defaultValue: "",
            rules: [],
            onActionAffirmative: function(name) {},
            onActionNegative: function() {}
        };
    },

    show: function() {
        if (!this.modalInstance)
            this.modalInstance = $(this.getDOMNode()).modal({
                closable: false,
                detachable: false,
                onApprove: function() {
                    return false;
                },
                onDeny: function() {
                    this.reset();
                    this.props.onActionNegative();
                    return true;
                }.bind(this)
            });

        this.modalInstance.modal("show");
    },

    hide: function() {
        this.modalInstance.modal("hide");
    },

    reset: function() {
        $(".input-form-" + this.props.identifier).form("reset");
        $(".input-form-" + this.props.identifier).removeClass("error");
    },

    componentDidMount: function() {
        $(".input-form-" + this.props.identifier).form({
            name: {
                identifier: this.props.identifier,
                rules: this.props.rules
            }
        }, {
            onSuccess: function() {
                this.props.onActionAffirmative(
                    $(".input-form-" + this.props.identifier).form("get value", this.props.identifier).trim()
                );
                this.hide();
                this.reset();
            }.bind(this),
            onFailure: function() {}
        }).submit(false);
    },

    componentWillUnmount: function () {
        if (this.modalInstance) {
            this.modalInstance.modal("destroy");
        }
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        /*
         * BUG (Semantic-UI):
         * If set default value in render() like below, the input box will be non-editable.
         * --
         *    <input name=this.props.identifier type="text" value={this.props.defaultValue} />
         * --
         * Here is a workaround to set default value by jQuery directly.
         */
        $("input[name='" + this.props.identifier + "']").val(nextProps.defaultValue);
        return true;
    },

    render: function() {
        return (
            <div className="ui small modal">
                <div className="header">
                    {this.props.title}
                </div>
                <form className={"ui form input-form-" + this.props.identifier}>
                    <div className="content input-modal-view-content">
                        <div className="description">
                            <div className="field">
                                <input name={this.props.identifier} type="text" />
                                <div className="ui error message"></div>
                            </div>
                        </div>
                    </div>
                    <div className="actions">
                        <div className="ui right labeled icon green button deny">
                            <i className="remove icon"></i>
                            Cancel
                        </div>
                        <div className="ui right labeled icon red submit button approve">
                            <i className="checkmark icon"></i>
                            OK
                        </div>
                    </div>
                </form>
            </div>
        );
    }
});

module.exports = InputModalViewController;
