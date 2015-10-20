import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import Dropdown from 'lib/cutie/Dropdown';
import UserAPI from 'lib/api/UserAPI';

export default class SignupForm extends React.Component {

  static defaultProps = {
    onValidate: () => {},
    onSuccess: () => {},
    onFailure: (error) => {}
  };

  constructor(props) {
    super(props);
    this.state = { groups: [], defaultGroup: '' };
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
        },{
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
    UserAPI.getGroups()
      .then((result) => {
        this.setState({ groups: result.groups, defaultGroup: 'User' });
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
    let groupItems = this.state.groups.map(
      (group) => <div key={group.name} className="item" data-value={group.name}>{group.name}</div>
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
            UserAPI.signup(formData)
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
        <div className="field" style={{ margin: '0 0 3em' }}>
          <img
            className="ui centered small circular image"
            src="/img/guest-avatar.jpg"
          />
          <Input type="hidden" name="avatar" />
        </div>
        <div className="two fields" style={{ margin: '0 0 1em' }}>
          <div className="field">
            <label>E-Mail</label>
            <Input type="text" name="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <Input type="password" name="password" />
          </div>
        </div>
        <div className="two fields">
          <div className="field">
            <label>First Name</label>
            <Input type="text" name="firstname" />
          </div>
          <div className="field">
            <label>Last Name</label>
            <Input type="text" name="lastname" />
          </div>
        </div>
        <div className="fields">
          <div className="ten wide field">
            <label>Group</label>
            <Dropdown
              name="group"
              type="multiple selection"
              selectHintText="Group"
              selectDefaultValue={this.state.defaultGroup}
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
            >
              <div className="item" data-value='0'>Female</div>
              <div className="item" data-value='1'>Male</div>
            </Dropdown>
          </div>
        </div>
        <div className="field">
          <label>Note</label>
          <Input type="text" name="note" />
        </div>
        <div className="ui error message" />
      </Form>
    );
  }
}
