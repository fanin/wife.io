import FSAPI from 'lib/api/FSAPI';
import { FSURLAppRoData } from 'lib/api/FSAPI';
import marked from 'marked';

class Markdown extends React.Component {

  static defaultProps = {
    string: ''
  };

  render() {
    return (
      <span style={{ display: 'inline-block' }} dangerouslySetInnerHTML={{
        __html: marked(this.props.string, { sanitize: true })
      }} />
    );
  }
}

class ApiDocView extends React.Component {

  static defaultProps = {
    api: null,
    currentMethod: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      apiMethodTopOffsets: []
    };
  }

  render() {
    var apiClass       = this.props.api ? this.props.api.apiclass : '';
    var apiDescription = this.props.api ? this.props.api.description : '';
    var apiVersion     = this.props.api ? 'Version ' + this.props.api.apiversion : '';
    var apiMethodTable = this.props.api ? this.props.api.apimethods.map((method) => {
      var tableClass = this.props.currentMethod === method.apimethod.name
               ? "ui celled structured orange table"
               : "ui celled structured table";

      var paramRows = method.apiparam ? method.apiparam.map((param) => {
        return (
          <tr>
            <td colSpan={4} className="center aligned">
              <code>{param.name}</code>
            </td>
            <td colSpan={4} className="center aligned">
              {param.type}
            </td>
            <td colSpan={12}>
              <Markdown string={param.description} />
            </td>
          </tr>
        );
      }) : [];

      var reqBodyRows = method.apireqbody
        ? method.apireqbody.map((body) => {
            return (
              <tr>
                <td colSpan={4} className="center aligned">
                  <code>{body.name}</code>
                </td>
                <td colSpan={4} className="center aligned">{body.type}</td>
                <td colSpan={12}><Markdown string={body.description} /></td>
              </tr>
            );
          })
        : [];

      var optionRows = method.apioption ? method.apioption.map((option) => {
        return (
          <tr>
            <td colSpan={4} className="center aligned"><code>{option.name}</code></td>
            <td colSpan={4} className="center aligned">{option.type}</td>
            <td colSpan={12}><Markdown string={option.description} /></td>
          </tr>
        );
      }) : [];

      var responseRows = method.apireturn ? method.apireturn.map((response) => {
        return (
          <tr>
            <td colSpan={2} className="center aligned">{response.status}</td>
            <td colSpan={4} className={"center aligned" + (response.statustext
                                                           ? "" : " disabled")}>
              {response.statustext ? response.statustext : 'Default'}
            </td>
            <td colSpan={3} className={"center aligned" + (response.name
                                                           ? "" : " disabled")}>
              <code>{response.name ? response.name : 'N/A'}</code>
            </td>
            <td colSpan={2} className={"center aligned" + (response.type
                                                           ? "" : " disabled")}>
              {response.type ? response.type : 'N/A'}
            </td>
            <td colSpan={9}><Markdown string={response.description} /></td>
          </tr>
        );
      }) : [];

      return (
        <div key={method.apimethod.name}>
          <p id={"" + method.apimethod.name}>&nbsp;</p>
          <p>&nbsp;</p>
          <table id={"table-" + method.apimethod.name} className={tableClass}>
            <tbody>
              <tr>
                <td className="active center aligned two wide column">Name</td>
                <td colSpan={20}><strong>{method.apimethod.name}</strong></td>
              </tr>
              <tr>
                <td className="active center aligned">Description</td>
                <td colSpan={20}><Markdown string={method.description} /></td>
              </tr>
              <tr>
                <td className="active center aligned">Method</td>
                <td colSpan={20}>
                  <strong>{method.apimethod.method + ' '}</strong>
                  {this.props.api.apibasepath}
                  <Markdown string={method.apimethod.path} />
                </td>
              </tr>
              <tr style={{display: method.apiparam ?  'table-row' : 'none'}}>
                <td
                  className="active center aligned"
                  rowSpan={method.apiparam ? method.apiparam.length + 1 : 1}
                >
                  Parameters
                </td>
                <td className="active center aligned" colSpan={4}>Name</td>
                <td className="active center aligned" colSpan={4}>Type</td>
                <td className="active" colSpan={12}>Description</td>
              </tr>
              {paramRows}
              <tr style={{display: method.apireqbody ?  'table-row' : 'none'}}>
                <td
                  className="active center aligned"
                  rowSpan={method.apireqbody ? method.apireqbody.length + 1 : 1}
                >
                  Request Body
                </td>
                <td className="active center aligned" colSpan={4}>Name</td>
                <td className="active center aligned" colSpan={4}>Type</td>
                <td className="active" colSpan={12}>Description</td>
              </tr>
              {reqBodyRows}
              <tr style={{display: method.apioption ?  'table-row' : 'none'}}>
                <td
                  className="active center aligned"
                  rowSpan={method.apioption ? method.apioption.length + 1 : 1}
                >
                  Options
                </td>
                <td className="active center aligned" colSpan={4}>Name</td>
                <td className="active center aligned" colSpan={4}>Type</td>
                <td className="active" colSpan={12}>Description</td>
              </tr>
              {optionRows}
              <tr style={{display: method.apireturn ?  'table-row' : 'none'}}>
                <td
                  className="active center aligned"
                  rowSpan={method.apireturn ? method.apireturn.length + 1 : 1}
                >
                  Responses
                </td>
                <td className="active center aligned" colSpan={2}>Status</td>
                <td className="active center aligned" colSpan={4}>Status Text</td>
                <td className="active center aligned" colSpan={3}>Data</td>
                <td className="active center aligned" colSpan={2}>Type</td>
                <td className="active" colSpan={9}>Description</td>
              </tr>
              {responseRows}
            </tbody>
          </table>
        </div>
      );
    }) : [];

    return (
      <div>
        <h1 className="ui header">{apiClass}</h1>
        <h3 className="ui grey header">{apiVersion}</h3>
        <p className="api-description"><Markdown string={apiDescription} /></p>
        {apiMethodTable}
      </div>
    );
  }
}

export default class AppMainView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      apiData: [],
      apiClass: '',
      apiMethod: ''
    };
    this.currentApi = null;
    this.anchorOffsets = [];
  }

  componentDidMount() {
    this.stickyInstance = $('.ui.sticky');
    window.addEventListener('scroll', this.handleScroll.bind(this));

    FSAPI.readFile(FSURLAppRoData('api.json'), { encoding: 'ascii' })
    .then((result) => {
      if (result.data) {
        var apidata = this.sortApiClass(JSON.parse(result.data));
        var defclass = apidata.length > 0 ? apidata[0].apiclass : '';
        var defmethod = (
              apidata[0].apimethods && apidata[0].apimethods.length > 0
            ) ? apidata[0].apimethods[0].apimethod.name : '';

        this.setState({
          apiData: apidata,
          apiClass: defclass,
          apiMethod: defmethod
        });

        this.stickyInstance.sticky({
          context: '#context',
          offset: 32,
          bottomOffset: 32,
          observeChanges: true
        });
      }
    })
    .catch((error) => {
      this.setState({ apiData: [], apiClass: '', apiMethod: '' });
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.apiClass !== this.state.apiClass ||
        nextState.apiMethod !== this.state.apiMethod)
      return true;
    else
      return false;
  }

  componentDidUpdate(prevProps, prevState) {
    var offsets = [];

    if (this.currentApi && this.currentApi.apiclass === this.state.apiClass) {
      this.currentApi.apimethods.map(function(method) {
        var top = $('#' + method.apimethod.name).offset().top;
        var height = $('#table-' + method.apimethod.name).height();
        offsets.push({
          method: method.apimethod.name,
          offset: top,
          height: height
        });
      });
    }

    this.anchorOffsets = offsets;
  }

  sortApiClass(apiData) {
    return apiData.sort((a, b) => {
      return +(a.apiclass > b.apiclass) || +(a.apiclass === b.apiclass) - 1
    });
  }

  handleApiClick(apiclass, apimethod) {
    this.setState({
      apiClass: apiclass,
      apiMethod: apimethod
    });
  }

  handleScroll(event) {
    var scrollTop = $(window).scrollTop();
    var scrollBottom = scrollTop + $(window).height();
    var lastAnchor = this.anchorOffsets[this.anchorOffsets.length - 1];
    var lastAnchorBottom = lastAnchor.offset + lastAnchor.height;
    for (let i in this.anchorOffsets) {
      if (scrollTop < this.anchorOffsets[i].offset +
                      this.anchorOffsets[i].height * 2 / 3) {
        if (scrollBottom > lastAnchorBottom)
          this.handleApiClick(this.state.apiClass, lastAnchor.method);
        else
          this.handleApiClick(this.state.apiClass, this.anchorOffsets[i].method);
        break;
      }
    }
  }

  render() {
    var apiMenuItems = this.state.apiData.map((api) => {
      if (this.state.apiClass === api.apiclass)
        this.currentApi = api;

      var apiMethodItems = api.apimethods.map((method) => {
        var itemClass = (
          this.state.apiClass === api.apiclass &&
          this.state.apiMethod === method.apimethod.name
        ) ? 'active item' : 'item';
        return (
          <a
            className={itemClass}
            key={method.apimethod.name}
            href={'#' + method.apimethod.name}
            onClick={() => {
              this.handleApiClick(api.apiclass, method.apimethod.name);
            }}
          >
            {method.apimethod.name}
          </a>
        );
      });

      return (
        <div className="api-menu" key={api.apiclass}>
          <a className="ui header" href={'#top'} onClick={() => {
            this.handleApiClick(
              api.apiclass,
              api.apimethods.length > 0 ? api.apimethods[0].apimethod.name : ''
            );
          }}>{api.apiclass}</a>

          <div
            className="ui secondary vertical pointing menu"
            style={{
              display: this.state.apiClass === api.apiclass ? 'block' : 'none'
            }}
          >
            {apiMethodItems}
          </div>
        </div>
      );
    });

    return (
      <div className="ui segment">
        <div className="ui left rail">
          <div className="ui sticky">
            {apiMenuItems}
          </div>
        </div>
        <div id="context">
          <ApiDocView api={this.currentApi} currentMethod={this.state.apiMethod} />
        </div>
      </div>
    );
  }
}
