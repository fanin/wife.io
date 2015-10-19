import SegmentAssetManager from './SegmentAssetManager.jsx';
import SegmentAssetBrowser from './SegmentAssetBrowser.jsx';

export default class SegmentAsset extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loadNotify: false
    };
  }

  componentDidMount() {
    $('.secondary.menu .item')
      .tab({ onLoad: () => this.setState({ loadNotify: !this.state.loadNotify }) })
      .tab('change tab', 'manager')
    ;
  }

  render() {
    return (
      <div className="ui basic segment">
        <div className="ui pointing secondary menu">
          <a className="item" data-tab="manager">Asset Management</a>
          <a className="item" data-tab="browser">Asset Discovery</a>
        </div>
        <SegmentAssetManager loadNotify={this.state.loadNotify} />
        <SegmentAssetBrowser loadNotify={this.state.loadNotify} />
      </div>
    );
  }
}
