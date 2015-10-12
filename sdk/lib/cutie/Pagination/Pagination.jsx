import classnames from 'classnames';
import Dropdown from 'lib/cutie/Dropdown';

export default class Pagination extends React.Component {

  static defaultProps = {
    classes: '',
    pages: 1,
    maxItems: 10,
    ellipsesAt: 5,
    onSelectPage: (page) => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.currentPage > this.props.pages && this.props.pages > 0)
      this.setState({ currentPage: this.props.pages });
    else if (this.state.currentPage !== prevState.currentPage)
      this.props.onSelectPage(this.state.currentPage);
  }

  setPosition(page) {
    this.setState({ currentPage: page });
  }

  position() {
    return this.state.currentPage;
  }

  render() {
    let pagination = [];
    let paginationEllipses = [];
    let i = 1, j = 5;

    for (; i <= this.props.pages; i++) {
      if (this.props.pages >= 10) {
        if (i === 5) {
          for (; j <= this.props.pages - 4; j++) {
            paginationEllipses.push(
              <a className="item" key={i + j + Date.now()} data-value={j}>{j}</a>
            );
          }

          pagination.push(
            <Dropdown
              key={'ellipses-' + Date.now()}
              classes='item'
              buttonText='...'
              action='select'
              onChange={(value, text) => {
                this.setState({ currentPage: value });
              }}
            >
              {paginationEllipses}
            </Dropdown>
          );

          i = j - 1;

          continue;
        }
      }

      pagination.push(
        <a
          key={i + Date.now()}
          className={classnames('item', { active: (this.state.currentPage === i) })}
          onClick={(e) => {
            let page = parseInt($(e.target).text());
            this.setState({ currentPage: page });
          }}
        >
          {i}
        </a>
      );
    }

    return (
      <div className={
        classnames("ui menu", {
          transparent: (this.props.classes.split(' ').indexOf('transparent') >= 0),
          hidden: (this.props.pages === 1)
        })
      }>
        {pagination}
      </div>
    );
  }
}
