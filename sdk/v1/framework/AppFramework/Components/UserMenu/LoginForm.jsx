import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import UserAPI from 'lib/api/UserAPI';

export default class LoginForm extends React.Component {

  static defaultProps = {
    onValidate: () => {},
    onSuccess: () => {},
    onFailure: (error) => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      email: 'knych.csy@gmail.com', //'admin@wife.io',
      password: 'chardi1225' //'741225'
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
      }
    };
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
            UserAPI.login(formData)
              .then(() => {
                this.props.onSuccess();
              })
              .catch((error) => {
                this.refs.form.addError([ 'Invalid user email or password' ]);
                this.props.onFailure(error);
              });
          }
        }}
      >
        <div className="field">
          <label>E-Mail</label>
          <Input
            type="text"
            name="email"
            defaultValue={this.state.email}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <Input
            type="password"
            name="password"
            defaultValue={this.state.password}
          />
        </div>
        <div className="ui error message" />
      </Form>
    );
  }
}
