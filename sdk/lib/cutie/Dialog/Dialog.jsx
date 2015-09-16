'use strict';

export default class DialogController extends React.Component {

  static defaultProps = {
    size: "small",
    title: "",
    image: "",
    message: "",
    customView: null,
    actionButtons: [],
    actionButtonsAlign: "right",
    closable: false,
    onShow: () => {},
    onHidden: () => {},
    onApprove: () => {},
    onDeny: () => {}
  };

  show() {
    if (!this.modalInstance)
      this.modalInstance = $(React.findDOMNode(this)).modal({
        closable: this.props.closable,
        detachable: false,
        onShow: this.props.onShow,
        onHide:this.props.onHide,
        onHidden: this.props.onHidden,
        onApprove: this.props.onApprove,
        onDeny: this.props.onDeny
      });
    this.modalInstance.modal('show');
  }

  hide() {
    this.modalInstance.modal('hide');
  }

  isActive() {
    return this.modalInstance.modal('is active');
  }

  componentDidMount() {
    $(React.findDOMNode(this))
      .find(".actions")
      .css("text-align", this.props.actionButtonsAlign);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.modalInstance && this.modalInstance.modal('is active')) {
      this.modalInstance.modal('refresh');
    }
  }

  componentWillUnmount() {
    this.modalInstance && this.modalInstance.modal('destroy');
  }

  render() {
    var image = this.props.image
          ? <div className="image">{this.props.image}</div> : null;

    var message = this.props.message
          ? (
            <div className="message">
              <h1 className="ui header">
                <div className="sub header">
                  {this.props.message}
                </div>
              </h1>
            </div>
          ) : null;

    var headerIcon = this.props.headerIcon
          ? <i className={this.props.headerIcon + " icon"} /> : null;

    var actionButtons = this.props.actionButtons.map((button) => {
      var cx = React.addons.classSet;
      var buttonClasses = cx(
        cx({
          'ui center': true,
          'labeled icon': button.iconType,
          'button': true
        }),
        button.color,
        button.classes,
        button.actionType
      );
      var buttonIcon = button.iconType
          ? <i className={button.iconType + ' icon'} /> : null;

      return (
        <div
          className={buttonClasses}
          key={button.title}
          onClick={(e) => {
            e.stopPropagation();
            button.onClick && button.onClick()
          }}
        >
          {buttonIcon}
          {button.title}
        </div>
      );
    });

    return (
      <div className={"ui long " + this.props.size + " modal"}>
        <div className="ui header">
          {headerIcon}
          <div className="content">
            {this.props.title}
          </div>
        </div>
        <div className="content">
          {image}
          {message}
          {this.props.customView}
        </div>
        <div className="actions">
          {actionButtons}
        </div>
      </div>
    );
  }
}
