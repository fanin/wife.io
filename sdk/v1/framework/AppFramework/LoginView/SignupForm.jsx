import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';

export default class SignupForm extends React.Component {

  static defaultProps = {
    onSubmit: () => {}
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    $('select.dropdown').dropdown();
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
        fields={
          {
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
            },
            firstname: {
              identifier: 'firstname',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your first name'
                }
              ]
            },
            lastname: {
              identifier: 'lastname',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your last name'
                }
              ]
            },
            gender: {
              identifier: 'gender',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a gender'
                }
              ]
            }
          }
        }
        onValidate={(hasError, formData) => {
          if (!hasError)
            this.props.onSubmit(formData);
        }}
      >
        <div className="two fields">
          <div className="field">
            <label>E-Mail</label>
            <Input type="text" name="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <Input type="password" name="password" />
          </div>
        </div>
        <div className="field" />
        <div className="field" />
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
            <Input type="text" name="group" />
          </div>
          <div className="six wide field">
            <label>Gender</label>
            <select className="ui dropdown" name="gender">
              <option value="">Gender</option>
              <option value="1">Male</option>
              <option value="0">Female</option>
            </select>
          </div>
        </div>
        <div className="ui error message" />
      </Form>
    );
  }
}


