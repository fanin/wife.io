import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import Dropdown from 'lib/cutie/Dropdown';
import UserAPI from 'lib/api/UserAPI';

export default class ProfileForm extends React.Component {

  static defaultProps = {
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
    Promise.all([ UserAPI.getGroups(), UserAPI.getProfile() ])
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
            UserAPI.setProfile(formData)
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
        <div className="two fields" style={{ margin: '0 0 1em' }}>
          <div className="field">
            <label>E-Mail</label>
            <Input
              readonly={true}
              type="text"
              name="email"
              defaultValue={this.state.email}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <Input type="password" name="password" />
          </div>
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