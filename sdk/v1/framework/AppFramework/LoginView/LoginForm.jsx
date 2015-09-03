import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';

export default class LoginForm extends React.Component {

  static defaultProps = {
    onSubmit: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: ''
    };
  }

  submit() {
    return this.refs.form.submit();
  }

  focus() {
    return this.refs.form.focus();
  }

  render() {
    return (
      <Form
        ref="form"
        preventDefaultSubmit={true}
        fields={{
          email: {
            identifier: 'email',
            rules: [
              {
                type: 'email',
                prompt: 'Please enter a valid e-mail address'
              }
            ]
          },
          password: {
            identifier: 'password',
            rules: [
              {
                type: 'empty',
                prompt: 'Please enter a password'
              },
              {
                type: 'minLength[6]',
                prompt: 'Your password must be at least 6 characters'
              }
            ]
          }
        }}
        onValidate={(hasError, formData) => {
          if (!hasError)
            this.props.onSubmit(formData);
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
