import classnames from 'classnames';

export default class Checkbox extends React.Component {

  static defaultProps = {
    name: '',
    style: 'slider', // 'toggle'
    fireOnInit: false,
    checked:  false,
    disabled: false,
    readOnly: false,
    classes: '',
    onChange: () => {},
    onChecked: () => {},
    onIndeterminate: () => {},
    onDeterminate: () => {},
    onUnchecked: () => {},
    beforeChecked: () => {},
    beforeIndeterminate: () => {},
    beforeDeterminate: () => {},
    beforeUnchecked: () => {},
    onEnable: () => {},
    onDisable: () => {}
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    $(React.findDOMNode(this)).checkbox({
      fireOnInit: this.props.fireOnInit,
      onChange: () => { this.props.onChange(this) }, // Callback after a checkbox is either checked or unchecked.
      onChecked: () => { this.props.onChecked(this) }, // Callback after a checkbox is checked.
      onIndeterminate: () => { this.props.onIndeterminat(this) }, // Callback after a checkbox is set to undeterminate.
      onDeterminate: () => { this.props.onDeterminate(this) }, // Callback after a checkbox is set to determinate.
      onUnchecked: () => { this.props.onUnchecked(this) }, // Callback after a checkbox is unchecked.
      beforeChecked: () => { this.props.beforeChecked(this) }, // Callback before a checkbox is checked. Can cancel change by returning false.
      beforeIndeterminate: () => { this.props.beforeIndeterminate(this) }, // Callback before a checkbox is set to undeterminate. Can cancel change by returning false.
      beforeDeterminate: () => { this.props.beforeDeterminate(this) }, // Callback before a checkbox is set to determinate. Can cancel change by returning false.
      beforeUnchecked: () => { this.props.beforeUnchecked(this) }, // Callback before a checkbox is unchecked. Can cancel change by returning false.
      onEnable: () => { this.props.onEnable(this) }, // Callback after a checkbox is enabled.
      onDisable: () => { this.props.onDisable(this) } // Callback after a checkbox is disabled.
    });
  }

  getName() {
    return this.props.name;
  }

  toggle() {
    $(React.findDOMNode(this)).checkbox('toggle');
  }

  check() {
    $(React.findDOMNode(this)).checkbox('check');
  }

  uncheck() {
    $(React.findDOMNode(this)).checkbox('uncheck');
  }

  enable() {
    $(React.findDOMNode(this)).checkbox('set enabled');
  }

  disable() {
    $(React.findDOMNode(this)).checkbox('set disabled');
  }

  isChecked() {
    return $(React.findDOMNode(this)).checkbox('is checked');
  }

  render() {
    return (
      <div
        className={
          classnames(
            "ui fitted",
            this.props.style,
            this.props.classes,
            {
              disabled: this.props.disabled,
              'read-only': this.props.readOnly
            },
            "checkbox"
          )
        }
      >
        <input
          type="checkbox"
          defaultChecked={this.props.checked}
          disabled={
            classnames({
              disabled: this.props.disabled
            })
          }
        />
        <label>{this.props.children}</label>
      </div>
    );
  }
}
