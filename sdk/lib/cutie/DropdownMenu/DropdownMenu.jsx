'use strict';

export default class DropdownMenu extends React.Component {

  static propTypes = {
    itemDataSource: React.PropTypes.array.isRequired
  };

  static defaultProps = {
    iconClass: '',
    useSelectBar: true,
    onChange: () => {}
  };

  constructor(props) {
    super(props);
    this.state = { disabled: false };
  }

  componentDidMount() {
    var _onChange = function(value, text, $selectedItem) {
      this.props.onChange(value, text);
    }.bind(this);

    var _settings = this.props.useSelectBar ? {
      transition: "drop",
      onChange: _onChange
    } : {
      transition: "drop",
      action: "hide",
      onChange: _onChange
    };

    $(React.findDOMNode(this)).dropdown(_settings);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.disabled)
      $(React.findDOMNode(this)).addClass("disabled");
    else
      $(React.findDOMNode(this)).removeClass("disabled");
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {
    var items = this.props.itemDataSource.map(function(data) {
      return (
        <div
          className = {data.disabled ? "item disabled" : "item"}
          key = {data.value}
          data-value = {data.value}
          onClick = {(this.state.disabled || data.disabled)
                      ? null
                      : data.onSelect}>
          <i className={data.icon + " icon"} />
          {data.text}
        </div>
      );
    }.bind(this));

    var buttonIcon = this.props.iconClass
                      ? <i className={this.props.iconClass + " icon"} />
                      : null;

    return (
      <div className="ui compact dropdown link item">
        {buttonIcon}
        <div className="menu">
          {items}
        </div>
      </div>
    );
  }
}
