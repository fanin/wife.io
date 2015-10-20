export default class MessageView extends React.Component {

  static defaultProps = {
    message: '',
    icon: ''
  };

  render() {
    return (
      <div>
        <i className={ "huge " + this.props.icon + " icon" }></i>
        <span className="text" style={{ fontSize: '1.5em' }}>{this.props.message}</span>
      </div>
    );
  }
}
