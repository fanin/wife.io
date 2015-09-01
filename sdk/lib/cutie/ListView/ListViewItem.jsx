export default class ListViewItem extends React.Component {

  static propTypes = {
    onSelect: React.PropTypes.func.isRequired
  };

  static defaultProps = {
    index: -1,
    active: false,
    disabled: false,
    titleText: '',
    subtitleText: '',
    detailText: ''
  };

  onItemClick() {
    this.props.onSelect(this.props.index);
  }

  render() {
    let itemClass = this.props.active ? "active item" : "item";
    return (
      <div
        className={itemClass}
        onClick={!this.props.disabled ? this.onItemClick.bind(this) : null}
      >
        <div className="content cutie-listview-content">
          <div className="cutie-listview-title">{this.props.titleText}</div>
          <div className="cutie-listview-subtitle">{this.props.subtitleText}</div>
          {this.props.detailText}
        </div>
      </div>
    );
  }
}
