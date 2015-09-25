'use strict';

export default class Form extends React.Component {

  static defaultProps = {
    preventDefaultSubmit: false
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    let form = $(React.findDOMNode(this)).form({
      fields: this.props.fields,
      onSuccess: () => {
        if (this.props.dataType === 'Array')
          this.props.onValidate && this.props.onValidate(
            false, $(React.findDOMNode(this)).serializeArray()
          );
        else
          this.props.onValidate && this.props.onValidate(
            false, $(React.findDOMNode(this)).serialize()
          );
      },
      onFailure: () => {
        this.props.onValidate && this.props.onValidate(true);
      }
    });

    if (this.props.preventDefaultSubmit)
      form.submit(false);
  }

  submit() {
    $(React.findDOMNode(this)).submit();
  }

  focus() {
    setTimeout(() => {
      let firstInput = $(React.findDOMNode(this))
                          .find(':input:not([readonly]):first');
      if (firstInput)
        firstInput.focus().val(firstInput.val());
    }, 1000);
  }

  reset() {
    $(React.findDOMNode(this)).form('reset');
    $(React.findDOMNode(this)).removeClass("error");
  }

  clear() {
    $(React.findDOMNode(this)).form('clear');
    $(React.findDOMNode(this)).removeClass("error");
  }

  addError(errors) {
    $(React.findDOMNode(this)).form('add errors', errors);
    $(React.findDOMNode(this)).find('.ui.error.message').show();
  }

  render() {
    return (
      <form className="ui form" method="POST" action={this.props.action}>
        {this.props.children}
      </form>
    );
  }
}
