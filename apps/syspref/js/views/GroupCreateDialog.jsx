import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import UserAPI from 'lib/api/UserAPI';

export default class GroupCreateDialog extends React.Component {

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
    this.validateRules = {
      name: {
        identifier: 'groupName',
        rules: [
          {
            type: 'empty',
            prompt: 'Please enter a group name'
          }
        ]
      }
    };
  }

  componentDidMount() {
    this.show();
  }

  componentWillUnmount() {
    this.hide();
  }

  show() {
    this.refs.groupCreateDialog.show();
  }

  hide() {
    this.refs.groupCreateDialog.hide();
  }

  render() {
    return (
      <Dialog.Container
        ref="groupCreateDialog"
        onApprove={ () => {
          this.refs.createForm.submit();
          return false;
        }}
        onVisible={ () => {
          this.refs.createForm.focus();
        }}
        onHidden={this.props.onHidden}
      >
        <Dialog.Header icon="circular users">
          Create a new group
        </Dialog.Header>
        <Dialog.Content>
          <Form
            ref="createForm"
            preventDefaultSubmit={true}
            fields={this.validateRules}
            onValidate={(error, formData) => {
              this.setState({ waiting: true });
              this.props.onValidate(formData);

              if (error) {
                this.props.onFailure(error);
                this.setState({ waiting: false });
              }
              else {
                UserAPI.addGroup(formData)
                  .then(() => {
                    this.props.onSuccess();
                    this.setState({ waiting: false });
                  })
                  .catch((error) => {
                    this.refs.createForm.addError([ error.message ]);
                    this.props.onFailure(error);
                    this.setState({ waiting: false });
                  })
                ;
              }
            }}
          >
            <div className="field">
              <label>Group name</label>
              <Input type="text" name="groupName" />
            </div>
            <div className="ui error message" />
          </Form>
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
