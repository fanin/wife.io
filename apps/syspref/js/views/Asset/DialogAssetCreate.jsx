import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Form from 'lib/cutie/Form';
import Button from 'lib/cutie/Button';
import Input from 'lib/cutie/Input';
import Dropdown from 'lib/cutie/Dropdown';
import UserAPI from 'lib/api/UserAPI';
import AssetAPI from 'lib/api/AssetAPI';

export class AssetCreateForm extends React.Component {

  static defaultProps = {
    onValidate: () => {},
    onSuccess: () => {},
    onFailure: (error) => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      users: []
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
    UserAPI.admGetList()
      .then((result) => {
        this.setState({
          users: result.users
        });
      })
    ;
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

  render() {
    let owners = this.state.users.map((user) => {
      return (
        <div key={user.email} className="item" data-value={user.email}>
          {user.firstname + ' ' + user.lastname + ' (' + user.group + ')'}
        </div>
      );
    });

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
            AssetAPI.add(formData)
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
            <Input type="text" name="assetid" />
          </div>
          <div className="field">
            <label>Name</label>
            <Input type="text" name="name" />
          </div>
        </div>
        <div className="two fields">
          <div className="field">
            <label>Vendor</label>
            <Input type="text" name="vendor" />
          </div>
          <div className="field">
            <label>Model</label>
            <Input type="text" name="model" />
          </div>
        </div>
        <div className="two fields">
          <div className="field">
            <label>Serial</label>
            <Input type="text" name="serial" />
          </div>
          <div className="field">
            <label>Owner</label>
            <Dropdown
              name="owner"
              type="search selection"
              selectHintText="Owner"
            >
              {owners}
            </Dropdown>
          </div>
        </div>
        <div className="two fields">
          <div className="field">
            <label>Acquisition Date</label>
            <Input type="text" name="acquisition_date" />
          </div>
          <div className="field">
            <label>Warranty Expiration Date</label>
            <Input type="text" name="warranty_expiration_date" />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <Input type="text" name="description" />
        </div>
        <div className="ui error message" />
      </Form>
    );
  }
}

export default class DialogAssetCreate extends React.Component {

  static defaultProps = {
    onValidate: (form) => {},
    onSuccess: () => {},
    onFailure: (error) => {},
    onHidden: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      waiting: false
    };
  }

  show() {
    this.refs.assetCreateDialog.show();
  }

  hide() {
    this.refs.assetCreateDialog.hide();
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
        ref="assetCreateDialog"
        closable={true}
        onApprove={() => {
          this.refs.assetCreateForm.submit();
          return false;
        }}
        onVisible={() => {
          this.refs.assetCreateForm.focus();
        }}
        onHidden={this.props.onHidden}
      >
        <Dialog.Header icon="circular laptop">
          Create a new asset
        </Dialog.Header>
        <Dialog.Content>
          <AssetCreateForm
            ref="assetCreateForm"
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
            Create
          </Button>
        </Dialog.ButtonSet>
      </Dialog.Container>
    );
  }
}
