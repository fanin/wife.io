import classnames from 'classnames';
import Button from 'lib/cutie/Button';
import Input from 'lib/cutie/Input';
import Checkbox from 'lib/cutie/Checkbox';
import Pagination from 'lib/cutie/Pagination';
import AssetAPI from 'lib/api/AssetAPI';
import DialogAssetCreator from './DialogAssetCreator.jsx';
import DialogAssetDataViewer from './DialogAssetDataViewer.jsx';

const LIMIT_PER_PAGE = 100;

export default class SegmentAssetBrowser extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      startBrowser: false,
      devices: [],
      devicePage: 1,
      deviceSearchText: ''
    };

    this.browserEventHandler = this.browserEventHandler.bind(this);
  }

  componentWillMount() {
    AssetAPI.on(this.browserEventHandler);
  }

  componentDidMount() {

  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.startBrowser !== this.state.startBrowser) {
      if (this.state.startBrowser)
        AssetAPI.startBrowser();
      else
        AssetAPI.stopBrowser();
    }
  }

  componentWillUnmount() {
    AssetAPI.off(this.browserEventHandler);
  }

  browserEventHandler(event) {
    if (event.eventType === 'ServiceUp') {
      let devices = this.state.devices;
      if (event.service.addresses.length > 0) {
        if (!this.findDevice(event.service)) {
          devices.push(event.service);
        }
      }
      this.setState({ devices: devices });
    }
    else if (event.eventType === 'ServiceDown') {
      this.setState({ devices: this.filterDevice(event.service) });
    }
  }

  findDevice(device) {
    let devices = this.state.devices.filter((d) => {
      if (
        d.name === device.name &&
        d.networkInterface === device.networkInterface &&
        d.port === device.port &&
        d.addresses.length === device.addresses.length
      ) {
        for (let i = 0; i < device.addresses.length; i++) {
          if (d.addresses[i] !== device.addresses[i]) {
            return false;
          }
        }
        return true;
      }
    });

    if (devices.length > 0)
      return devices[0];
    else
      return null;
  }

  filterDevice(device) {
    return this.state.devices.filter((d) => {
      if (
        d.name === device.name &&
        d.networkInterface === device.networkInterface
      ) {
        return false;
      }
      else
        return true;
    });
  }

  assetCreateSuccess() {
    this.refs.assetCreateDialog.hide();
  }

  render() {
    let deviceTable = this.state.devices.filter((device) => {
      if (this.state.deviceSearchText)
        return JSON.stringify(device)
                   .replace(/'":{},/g, ' ')
                   .match(new RegExp(this.state.deviceSearchText, 'ig'));
      else
        return true;
    }).map((device) => {
      return (
        <tr key={device.fullname}>
          <td style={{ textAlign: 'center' }}>
            <i
              className="add circle green link big icon"
              onClick={() => {
                this.refs.assetCreateDialog.show({
                  name: device.name
                });
              }}
            />
          </td>
          <td style={{ textAlign: 'center' }}>{device.name}</td>
          <td style={{ textAlign: 'center' }}>{device.addresses.join('\n')}</td>
          <td style={{ textAlign: 'center' }}>{device.host.split('.local')[0]}</td>
          <td style={{ textAlign: 'center' }}>{device.port}</td>
          <td style={{ textAlign: 'center' }}>{device.networkInterface}</td>
          <td style={{ textAlign: 'center' }}>
            <i
              className={classnames("browser link large icon", {
                hidden: !device.txtRecord
              })}
              onClick={() => { this.refs.assetDataViewer.show(device.txtRecord) }}
            />
          </td>
        </tr>
      );
    });

    return (
      <div className="ui tab vertical padded segment" data-tab="browser">
        <div className="ui borderless menu">
          <div className="ui item">
            <div
              className={classnames("ui button", {
                green: !this.state.startBrowser,
                red: this.state.startBrowser
              })}
              onClick={(e) => this.setState({ startBrowser: !this.state.startBrowser })}
            >
              {this.state.startBrowser ? 'Stop' : 'Start'}
            </div>
          </div>
          <Pagination
            ref="devicePaginator"
            classes="transparent"
            pages={this.state.devicePages}
            onSelectPage={(page) => {  }}
          />
          <div className="right menu">
            <div className="item">
              <div className="ui icon input">
                <Input
                  type="text"
                  placeholder="Search ..."
                  onChange={(text) => {
                    this.refs.devicePaginator.setPosition(1);
                    this.setState({ deviceSearchText: text || '' });
                  }}
                />
                <i className="search link icon"></i>
              </div>
            </div>
          </div>
        </div>
        <table className="ui compact celled table">
          <col width="5%" />
          <col width="30%" />
          <col width="15%" />
          <col width="35%" />
          <col width="5%" />
          <col width="5%" />
          <col width="5%" />
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}></th>
              <th style={{ textAlign: 'center' }}>Name</th>
              <th style={{ textAlign: 'center' }}>IP</th>
              <th style={{ textAlign: 'center' }}>Host</th>
              <th style={{ textAlign: 'center' }}>Port</th>
              <th style={{ textAlign: 'center' }}>Iface</th>
              <th style={{ textAlign: 'center' }}>Data</th>
            </tr>
          </thead>
          <tbody>
            {deviceTable}
          </tbody>
        </table>
        <div>
          <DialogAssetCreator
            ref="assetCreateDialog"
            onSuccess={this.assetCreateSuccess.bind(this)}
          />
          <DialogAssetDataViewer ref="assetDataViewer" />
        </div>
      </div>
    );
  }
}
