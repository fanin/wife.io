import classnames from 'classnames';

export default class Button extends React.Component {

  static defaultProps = {
    style: '',
    color: '',
    icon: '',
    classes: '',
    onClick: (e) => {}
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    $(React.findDOMNode(this)).click((e) => {
      this.props.onClick();
    });
  }

  render() {
    let classes = classnames(
      'ui',
      this.props.style,
      this.props.color,
      this.props.classes,
      'button'
    );

    let button;

    if (this.props.style === 'labeled icon') {
      button = (
        <div className={classes} onClick={this.props.onClick}>
          <i className={this.props.icon + " icon"} />
          {this.props.children}
        </div>
      );
    }
    else {
      button = (
        <div className={classes}>
          {this.props.children}
        </div>
      );
    }

    return button;
  }
}
