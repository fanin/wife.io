import classnames from 'classnames';
import Button from 'lib/cutie/Button';
import Input from 'lib/cutie/Input';
import Checkbox from 'lib/cutie/Checkbox';
import Pagination from 'lib/cutie/Pagination';
import AssetAPI from 'lib/api/AssetAPI';
import DialogAssetCreator from './DialogAssetCreator.jsx';
import DialogAssetUpdater from './DialogAssetUpdater.jsx';
import DialogUserViewer from '../UserGroup/DialogUserViewer.jsx';

const LIMIT_PER_PAGE = 100;

export default class SegmentAssetManager extends React.Component {

  static defaultProps = {
    loadNotify: false
  };

  constructor(props) {
    super(props);
    this.state = {
      assets: [],
      assetPages: 1,
      assetSearchText: ''
    };

    this.showUserDialog = this.showUserDialog.bind(this);
  }

  componentDidMount() {
    AssetAPI.get({
      page: this.refs.assetPaginator.position(),
      limit: LIMIT_PER_PAGE
    }).then((result) => {
      this.setState({
        assets: result.assets,
        assetPages: this.calcPages(result.count)
      });
    }).catch((error) => {
      if (error.code !== 403)
        console.log(error);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.loadNotify !== this.props.loadNotify ||
      prevState.assetSearchText !== this.state.assetSearchText
    )
      this.reloadAssets();
  }

  calcPages(count) {
    return Math.ceil(count / LIMIT_PER_PAGE) || 1;
  }

  reloadAssets() {
    return AssetAPI.get({
      searches: this.state.assetSearchText,
      page: this.refs.assetPaginator.position(),
      limit: LIMIT_PER_PAGE
    }).then((result) => {
      this.setState({
        assets: result.assets,
        assetPages: this.calcPages(result.count)
      });
    }).catch((error) => {
      console.log(error);
    });
  }

  showUserDialog(email) {
    this.refs.userInfoDialog.show(email);
  }

  showAssetCreateDialog() {
    this.refs.assetCreateDialog.show();
  }

  showAssetUpdateDialog(assetid) {
    this.refs.assetUpdateDialog.show(assetid);
  }

  assetCreateSuccess() {
    this.refs.assetCreateDialog.hide();
    this.reloadAssets();
  }

  assetUpdateSuccess() {
    this.refs.assetUpdateDialog.hide();
    this.reloadAssets();
  }

  render() {
    let assetTable = this.state.assets.map((asset) => {
      let ownerLink = asset.owner
        ? <a
            className="ui label"
            onClick={(e) => { this.showUserDialog(asset.owner) }}
          >
            {asset.owner}
          </a>
        : null;

      return (
        <tr key={asset.assetid}>
          <td style={{ textAlign: 'center' }}>{asset.assetid}</td>
          <td style={{ textAlign: 'center' }}>{asset.name}</td>
          <td style={{ textAlign: 'center' }}>{asset.vendor}</td>
          <td style={{ textAlign: 'center' }}>{asset.model}</td>
          <td style={{ textAlign: 'center' }}>{asset.serial}</td>
          <td style={{ textAlign: 'center' }}>{ownerLink}</td>
          <td style={{ textAlign: 'center' }}>
            <Button style="circular icon" color="gray" classes="mini" />
          </td>
          <td style={{ textAlign: 'center' }}>
            <i
              className="write link large icon"
              onClick={() => { this.showAssetUpdateDialog(asset.assetid) }}
            />
            <i
              className="trash link large red icon"
              onClick={() => {
                AssetAPI.remove(asset.assetid)
                  .then((result) => {
                    return this.reloadAssets();
                  })
                  .catch((error) => {
                    console.log(error);
                  })
                ;
              }}
            />
          </td>
        </tr>
      );
    });

    return (
      <div className="ui tab vertical padded segment" data-tab="manager">
        <div className="ui borderless menu">
          <div className="ui item">
            <div
              className="ui green button"
              onClick={this.showAssetCreateDialog.bind(this)}
            >
              New Asset
            </div>
          </div>
          <Pagination
            ref="assetPaginator"
            classes="transparent"
            pages={this.state.assetPages}
            onSelectPage={(page) => { this.reloadAssets() }}
          />
          <div className="right menu">
            <div className="item">
              <div className="ui icon input">
                <Input
                  type="text"
                  placeholder="Search Asset..."
                  onChange={(text) => {
                    this.refs.assetPaginator.setPosition(1);
                    this.setState({ assetSearchText: text || '' });
                  }}
                />
                <i className="search link icon"></i>
              </div>
            </div>
          </div>
        </div>
        <table className="ui compact celled table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>ID</th>
              <th style={{ textAlign: 'center' }}>Name</th>
              <th style={{ textAlign: 'center' }}>Vendor</th>
              <th style={{ textAlign: 'center' }}>Modal</th>
              <th style={{ textAlign: 'center' }}>Serial Number</th>
              <th style={{ textAlign: 'center' }}>Owner</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Edit</th>
            </tr>
          </thead>
          <tbody>
            {assetTable}
          </tbody>
        </table>
        <div>
          <DialogAssetCreator
            ref="assetCreateDialog"
            onSuccess={this.assetCreateSuccess.bind(this)}
          />
          <DialogAssetUpdater
            ref="assetUpdateDialog"
            onSuccess={this.assetUpdateSuccess.bind(this)}
          />
          <DialogUserViewer ref="userInfoDialog" />
        </div>
      </div>
    );
  }
}
