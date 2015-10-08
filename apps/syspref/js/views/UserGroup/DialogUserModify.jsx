import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Form from 'lib/cutie/Form';
import Button from 'lib/cutie/Button';
import Input from 'lib/cutie/Input';
import Dropdown from 'lib/cutie/Dropdown';
import UserAPI from 'lib/api/UserAPI';

export class UserModifyForm extends React.Component {

  static defaultProps = {
    email: '',
    onValidate: () => {},
    onSuccess: () => {},
    onFailure: (error) => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      firstname: '',
      lastname: '',
      group: '',
      gender: '',
      groups: []
    };
    this.validateRules = {
      email: {
        identifier: 'email',
        rules: [{
          type: 'email',
          prompt: 'Please enter a valid e-mail address'
        }]
      },
      password: {
        identifier: 'password',
        rules: [{
          type: 'empty',
          prompt: 'Please enter a password'
        }, {
          type: 'minLength[6]',
          prompt: 'Your password must be at least 6 characters'
        }]
      },
      firstname: {
        identifier: 'firstname',
        rules: [{
          type: 'empty',
          prompt: 'Please enter your first name'
        }]
      },
      lastname: {
        identifier: 'lastname',
        rules: [{
          type: 'empty',
          prompt: 'Please enter your last name'
        }]
      },
      gender: {
        identifier: 'gender',
        rules: [{
          type: 'empty',
          prompt: 'Please select your gender'
        }]
      }
    };
  }

  componentDidMount() {
    Promise.all([ UserAPI.getGroups(), UserAPI.getProfile({ user: this.props.email }) ])
      .then((values) => {
        this.setState({
          email: values[1].user.email,
          firstname: values[1].user.firstname,
          lastname: values[1].user.lastname,
          group: values[1].user.group,
          gender: values[1].user.gender,
          groups: values[0].groups
        });
      })
    ;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.email !== this.props.email) {
      Promise.all([
        UserAPI.getGroups(),
        UserAPI.getProfile({ user: this.props.email })
      ]).then((values) => {
        this.setState({
          email: values[1].user.email,
          firstname: values[1].user.firstname,
          lastname: values[1].user.lastname,
          group: values[1].user.group,
          gender: values[1].user.gender,
          groups: values[0].groups
        });
      });
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

  render() {
    let groupItems = this.state.groups.map(
      (group) => <div key={group} className="item" data-value={group}>{group}</div>
    );

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
            UserAPI.admSetProfile(formData)
              .then(() => {
                this.props.onSuccess();
              })
              .catch((error) => {
                this.refs.form.addError([ 'Password incorrect' ]);
                this.props.onFailure(error);
              })
            ;
          }
        }}
      >
        <div className="field" style={{ margin: '0 0 3em' }}>
          <img
            className="ui centered small circular image"
            src="/img/guest-avatar.jpg"
          />
          <Input type="hidden" name="avatar" />
        </div>
        <div className="field" style={{ margin: '0 0 1em' }}>
          <label>E-Mail</label>
          <Input
            readonly={true}
            type="text"
            name="email"
            defaultValue={this.state.email}
          />
        </div>
        <div className="two fields">
          <div className="field">
            <label>First Name</label>
            <Input
              type="text"
              name="firstname"
              defaultValue={this.state.firstname}
            />
          </div>
          <div className="field">
            <label>Last Name</label>
            <Input
              type="text"
              name="lastname"
              defaultValue={this.state.lastname}
            />
          </div>
        </div>
        <div className="fields">
          <div className="ten wide field">
            <label>Group</label>
            <Dropdown
              name="group"
              type="multiple selection"
              selectHintText="Group"
              selectDefaultValue={this.state.group}
            >
              {groupItems}
            </Dropdown>
          </div>
          <div className="six wide field">
            <label>Gender</label>
            <Dropdown
              name="gender"
              type="selection"
              selectHintText="Gender"
              selectDefaultValue={
                typeof this.state.gender === 'boolean'
                  ? (this.state.gender ? 1 : 0)
                  : null
              }
            >
              <div className="item" data-value='0'>Female</div>
              <div className="item" data-value='1'>Male</div>
            </Dropdown>
          </div>
        </div>
        <div className="ui error message" />
      </Form>
    );
  }
}

export default class DialogUserCreate extends React.Component {

  static defaultProps = {
    onValidate: (form) => {},
    onSuccess: () => {},
    onFailure: (error) => {},
    onHidden: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      waiting: false
    };
  }

  show(email) {
    this.setState({ email: email });
    this.refs.userModifyDialog.show();
  }

  hide() {
    this.refs.userModifyDialog.hide();
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
        ref="userModifyDialog"
        closable={true}
        onApprove={() => {
          this.refs.userModifyForm.submit();
          return false;
        }}
        onVisible={() => {
          this.refs.userModifyForm.focus();
        }}
        onHidden={this.props.onHidden}
      >
        <Dialog.Header icon="circular users">
          Update user profile
        </Dialog.Header>
        <Dialog.Content>
          <UserModifyForm
            ref="userModifyForm"
            email={this.state.email}
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

