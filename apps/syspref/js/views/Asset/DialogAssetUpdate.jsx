import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Form from 'lib/cutie/Form';
import Button from 'lib/cutie/Button';
import Input from 'lib/cutie/Input';
import Dropdown from 'lib/cutie/Dropdown';
import UserAPI from 'lib/api/UserAPI';
import AssetAPI from 'lib/api/AssetAPI';

export class AssetModifyForm extends React.Component {

  static defaultProps = {
    assetid: '',
    onValidate: () => {},
    onSuccess: () => {},
    onFailure: (error) => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      users: [],
      assetid: '',
      name: '',
      vendor: '',
      model: '',
      serial: '',
      owner: '',
      acquisition_date: '',
      warranty_expiration_date: '',
      description: ''
    };

    this.validateRules = {
      assetid: {
        identifier: 'assetid',
        rules: [{
          type: 'empty',
          prompt: 'Please enter an asset ID'
        }]
      },
      name: {
        identifier: 'name',
        rules: [{
          type: 'empty',
          prompt: 'Please enter asset name'
        }]
      },
      acquisition_date: {
        identifier: 'acquisition_date',
        rules: [{
          type: 'regExp[/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])|(^$)/]',
          prompt: 'Acquisition Date: Date format is YYYY-MM-DD (Ex: 2014-10-01)'
        }]
      },
      warranty_expiration_date: {
        identifier: 'warranty_expiration_date',
        rules: [{
          type: 'regExp[/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])|(^$)/]',
          prompt: 'Warranty Expiration Date: Date format is YYYY-MM-DD (Ex: 2014-02-26)'
        }]
      }
    };
  }

  componentDidMount() {
    if (this.props.assetid) {
      Promise.all([ UserAPI.admGetList(), AssetAPI.get({ assetid: this.props.assetid }) ])
        .then((values) => {
          if (values[1].assets[0]) {
            this.setState({
              users: values[0].users,
              assetid: values[1].assets[0].assetid,
              name: values[1].assets[0].name,
              vendor: values[1].assets[0].vendor,
              model: values[1].assets[0].model,
              serial: values[1].assets[0].serial,
              owner: values[1].assets[0].owner,
              acquisition_date: values[1].assets[0].acquisition_date,
              warranty_expiration_date: values[1].assets[0].warranty_expiration_date,
              description: values[1].assets[0].description
            });
          }
        })
      ;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.assetid !== this.props.assetid && this.props.assetid != '') {
      Promise.all([ UserAPI.admGetList(), AssetAPI.get({ assetid: this.props.assetid }) ])
        .then((values) => {
          if (values[1].assets[0]) {
            this.setState({
              users: values[0].users,
              assetid: values[1].assets[0].assetid,
              name: values[1].assets[0].name,
              vendor: values[1].assets[0].vendor,
              model: values[1].assets[0].model,
              serial: values[1].assets[0].serial,
              owner: values[1].assets[0].owner,
              acquisition_date: values[1].assets[0].acquisition_date,
              warranty_expiration_date: values[1].assets[0].warranty_expiration_date,
              description: values[1].assets[0].description
            });
          }
        })
      ;
    }
  }

  submit() {
    return this.refs.form.submit();
  }

  focus() {
    return this.refs.form.focus();
  }

  reset() {
    this.refs.form.reset();
  }

  formatDate(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  render() {
    let owners = this.state.users.map((user) => {
      return (
        <div key={user.email} className="item" data-value={user.email}>
          {user.firstname + ' ' + user.lastname + ' (' + user.group + ')'}
        </div>
      );
    });

    owners.unshift(<div key="none-user" className="item" data-value="">None</div>);

    return (
      <Form
        ref="form"
        preventDefaultSubmit={true}
        fields={this.validateRules}
        onValidate={(error, formData) => {
          this.props.onValidate(formData);

          if (error) {
            this.props.onFailure(error);
          }
          else {
            AssetAPI.update(this.props.assetid, formData)
              .then(() => {
                this.props.onSuccess();
              })
              .catch((error) => {
                this.refs.form.addError([ error.message ]);
                this.props.onFailure(error);
              })
            ;
          }
        }}
      >
        <div className="two fields">
          <div className="field">
            <label>ID</label>
            <Input type="text" name="assetid" defaultValue={this.state.assetid} />
          </div>
          <div className="field">
            <label>Name</label>
            <Input type="text" name="name" defaultValue={this.state.name} />
          </div>
        </div>
        <div className="two fields">
          <div className="field">
            <label>Vendor</label>
            <Input type="text" name="vendor" defaultValue={this.state.vendor} />
          </div>
          <div className="field">
            <label>Model</label>
            <Input type="text" name="model" defaultValue={this.state.model} />
          </div>
        </div>
        <div className="two fields">
          <div className="field">
            <label>Serial</label>
            <Input type="text" name="serial" defaultValue={this.state.serial} />
          </div>
          <div className="field">
            <label>Owner</label>
            <Dropdown
              name="owner"
              type="search selection"
              selectHintText="Owner"
              selectDefaultValue={this.state.owner}
            >
              {owners}
            </Dropdown>
          </div>
        </div>
        <div className="two fields">
          <div className="field">
            <label>Acquisition Date</label>
            <Input
              type="text"
              name="acquisition_date"
              defaultValue={this.formatDate(this.state.acquisition_date)}
            />
          </div>
          <div className="field">
            <label>Warranty Expiration Date</label>
            <Input
              type="text"
              name="warranty_expiration_date"
              defaultValue={this.formatDate(this.state.warranty_expiration_date)}
            />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <Input type="text" name="description" defaultValue={this.state.description}/>
        </div>
        <div className="ui error message" />
      </Form>
    );
  }
}

export default class DialogAssetModify extends React.Component {

  static defaultProps = {
    onValidate: (form) => {},
    onSuccess: () => {},
    onFailure: (error) => {},
    onHidden: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      assetid: '',
      waiting: false
    };
  }

  show(assetid) {
    this.setState({ assetid: assetid });
    this.refs.assetModifyDialog.show();
  }

  hide() {
    this.refs.assetModifyDialog.hide();
  }

  onValidate(formData) {
    this.props.onValidate(formData);
    this.setState({ waiting: true });
  }

  onSuccess() {
    this.props.onSuccess();
    this.setState({ waiting: false });
  }

  onFailure(error) {
    this.props.onFailure(error);
    this.setState({ waiting: false });
  }

  render() {
    return (
      <Dialog.Container
        ref="assetModifyDialog"
        closable={true}
        onApprove={() => {
          this.refs.assetModifyForm.submit();
          return false;
        }}
        onVisible={() => {
          this.refs.assetModifyForm.focus();
        }}
        onHidden={this.props.onHidden}
      >
        <Dialog.Header icon="circular laptop">
          Update asset data
        </Dialog.Header>
        <Dialog.Content>
          <AssetModifyForm
            ref="assetModifyForm"
            assetid={this.state.assetid}
            onValidate={this.onValidate.bind(this)}
            onSuccess={this.onSuccess.bind(this)}
            onFailure={this.onFailure.bind(this)}
          />
        </Dialog.Content>
        <Dialog.ButtonSet>
          <Button classes="deny">
            Cancel
          </Button>
          <Button
            color="green"
            classes={classnames("approve", { loading: this.state.waiting })}
          >
            Update
          </Button>
        </Dialog.ButtonSet>
      </Dialog.Container>
    );
  }
}
