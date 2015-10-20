import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import UserAPI from 'lib/api/UserAPI';

export default class PasswordForm extends React.Component {

  static defaultProps = {
    onValidate: () => {},
    onSuccess: () => {},
    onFailure: (error) => {}
  };

  constructor(props) {
    super(props);
    this.state = { email: '' };
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
          prompt: 'Please enter your old password'
        }, {
          type: 'minLength[6]',
          prompt: 'Your password must be at least 6 characters'
        }]
      },
      newPassword: {
        identifier: 'newPassword',
        rules: [{
          type: 'empty',
          prompt: 'Please enter your new password'
        }, {
          type: 'minLength[6]',
          prompt: 'New password must be at least 6 characters'
        }]
      },
      confirmPassword: {
        identifier: 'confirmPassword',
        rules: [{
          type: 'match[newPassword]',
          prompt: 'New password and confirm password don\'t match'
        }]
      }
    };
  }

  componentDidMount() {
    UserAPI.getProfile()
      .then((result) => {
        this.setState({ email: result.user.email });
      })
      .catch((error) => {

      });
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
            UserAPI.setPassword(formData)
              .then(() => {
                this.props.onSuccess();
              })
              .catch((error) => {
                this.refs.form.addError([ 'Old password incorrect' ]);
                this.props.onFailure(error);
              });
          }
        }}
      >
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
          <label>Old Password</label>
          <Input type="password" name="password" />
        </div>
        <div className="field">
          <label>New Password</label>
          <Input type="password" name="newPassword" />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <Input type="password" name="confirmPassword" />
        </div>
        <div className="ui error message" />
      </Form>
    );
  }
}
