'use strict';

import classnames from 'classnames';
import { randomString } from 'lib/utils/common/string-misc'

class Dialog extends React.Component {

  static defaultProps = {
    size: "small",
    onShow: () => {},
    onVisible: () => {},
    onHide: () => {},
    onHidden: () => {},
    onApprove: () => {},
    onDeny: () => {}
  };

  componentDidMount() {
    $(React.findDOMNode(this)).modal({
      closable: false,
      detachable: false,
      onShow: this.props.onShow,
      onVisible: this.props.onVisible,
      onHide:this.props.onHide,
      onHidden: this.props.onHidden,
      onApprove: this.props.onApprove,
      onDeny: this.props.onDeny
    });

    $(React.findDOMNode(this)).click((e) => {
      e.stopPropagation();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    $(React.findDOMNode(this)).modal('refresh');
  }

  componentWillUnmount() {
    $(React.findDOMNode(this)).modal('hide');
  }

  show() {
    $(React.findDOMNode(this)).modal('show');
  }

  hide() {
    $(React.findDOMNode(this)).modal('hide');
  }

  render() {
    return (
      <div className={"ui long " + this.props.size + " modal"}>
        { this.props.children }
      </div>
    );
  }
}

export class Header extends React.Component {

  static defaultProps = {
    icon: ''
  };

  render() {
    let headerIcon = this.props.icon
      ? <i className={this.props.icon + " icon"} />
      : null;

    return (
      <div className="ui header">
        {headerIcon}
        <div className="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}

export class Content extends React.Component {

  static defaultProps = {
    imageElement: null
  };

  render() {
    let contentClass = classnames({ image: this.props.imageElement }, 'content');
    let imageClass = classnames({ image: this.props.imageElement });

    return (
      <div className={contentClass}>
        <div className={imageClass}>
          {this.props.imageElement}
        </div>
        <div className="description">
          {this.props.children}
        </div>
      </div>
    );
  }
}


export class ButtonSet extends React.Component {
  render() {
    return (
      <div className="actions">
        {this.props.children}
      </div>
    );
  }
}


export class Container extends React.Component {

  static defaultProps = {
    size: "small",
    closable: false,
    onShow: () => {},
    onVisible: () => {},
    onHide: () => {},
    onHidden: () => {},
    onApprove: () => {},
    onDeny: () => {}
  };

  constructor(props) {
    super(props);
    this.state = { hideCall: false, useCount: 0 };
    this.componentId = 'dialog-' + randomString('XXXXXXXXXXXX');
  }

  componentDidMount() {
    $('.dialog-container').click((e) => {
      e.stopPropagation();

      if (this.props.closable) {
        this.hide();
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.useCount != this.state.useCount && this.state.useCount > 0) {
      if (this.state.useCount == 1)
        this.renderDialog();
      this.dialog.show();
    }
    else if (prevState.useCount > 0 && this.state.useCount == 0) {
      setTimeout(() => {
        React.unmountComponentAtNode(document.getElementById(this.componentId));
        this.props.onHidden();
      }, 200);
    }
    else
      this.renderDialog();
  }

  renderDialog() {
    this.dialog = React.render(
      <Dialog
        {...this.props}
        onHidden={() => {
          let state = { hideCall: false };

          if (!this.state.hideCall) {
            if (this.state.useCount > 0) {
              state = {
                hideCall: false,
                useCount: this.state.useCount - 1
              };
            }
          }
          this.setState(state);
        }}
      >
        { this.props.children }
      </Dialog>,
      document.getElementById(this.componentId)
    );
  }

  show() {
    this.setState({ useCount: this.state.useCount + 1 });
  }

  hide() {
    if (this.state.useCount === 1)
      this.dialog.hide();
    else if (this.state.useCount > 1)
      this.setState({ useCount: this.state.useCount - 1 });
  }

  render() {
    return (
      <div
        className={classnames(
          "dialog-container",
          { 'hidden': this.state.useCount === 0 }
        )}
      >
        <div id={this.componentId}></div>
      </div>
    );
  }
}

