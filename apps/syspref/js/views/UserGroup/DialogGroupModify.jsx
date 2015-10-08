import classnames from 'classnames';
import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import UserAPI from 'lib/api/UserAPI';

export default class DialogGroupModify extends React.Component {

  static defaultProps = {
    defaultName: '',
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
      rule1: {
        identifier: 'groupName',
        rules: [
          {
            type: 'empty',
            prompt: 'Please enter a group name'
          }
        ]
      },
      rule2: {
        identifier: 'groupNameNew',
        rules: [
          {
            type: 'empty',
            prompt: 'Please enter a new group name'
          }
        ]
      }
    };
  }

  componentDidMount() {
    //this.show();
  }

  componentWillUnmount() {
    //this.hide();
  }

  show() {
    this.refs.groupModifyDialog.show();
  }

  hide() {
    this.refs.groupModifyDialog.hide();
  }

  render() {
    let title = '';

    let buttons = [
      {
        title: 'Cancel',
        iconType: '',
        color: '',
        actionType: 'deny'
      },
      {
        title: 'Save',
        iconType: '',
        color: 'green',
        classes: this.state.waiting ? 'loading' : '',
        actionType: this.state.waiting ? '' : 'approve'
      }
    ];

    return (
      <Dialog.Container
        ref="groupModifyDialog"
        closable={true}
        onApprove={ () => {
          this.refs.modifyForm.submit();
          return false;
        }}
        onVisible={ () => {
          this.refs.modifyForm.focus();
        }}
        onHidden={this.props.onHidden}
      >
        <Dialog.Header icon="circular users">
          Modify group name
        </Dialog.Header>
        <Dialog.Content>
          <Form
            ref="modifyForm"
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
                UserAPI.renameGroup(formData)
                  .then(() => {
                    this.setState({ waiting: false });
                    this.props.onSuccess();
                  })
                  .catch((error) => {
                    this.refs.modifyForm.addError([ error.message ]);
                    this.setState({ waiting: false });
                    this.props.onFailure(error);
                  })
                ;
              }
            }}
          >
            <div className="field">
              <label>Current group name</label>
              <Input
                type="text"
                name="groupName"
                defaultValue={this.props.defaultName}
                readonly={true}
              />
            </div>
            <div className="field">
              <label>New group name</label>
              <Input type="text" name="groupNameNew" />
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
            Save
          </Button>
        </Dialog.ButtonSet>
      </Dialog.Container>
    );
  }
}
