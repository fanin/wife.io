var ShopActionCreators = require('../actions/ShopActionCreators');
var ShopStore          = require('../stores/ShopStore');
var ShopConstants      = require('../constants/ShopConstants');

var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var APP_COLORS = [
    'blue', 'green', 'orange', 'pink', 'purple', 'red', 'teal', 'yellow'
];

var AppManagerAgentMixin = {
    appListDidReceive: function(apps) {

    },

    appWillInstall: function(instInfo) {

    },

    appIsUploading: function(instInfo) {
        this.setState({
            dimmerTitle: "Uploading...",
            dimmerMessage: "Please wait...",
            installProgress: instInfo.progress
        });
    },

    appIsInstalling: function(instInfo) {
        this.setState({
            hideDimmerButton: true,
            dimmerTitle: "Installing...",
            dimmerMessage: "Please wait..."
        });
    },

    appDidInstall: function(instInfo) {
        setTimeout(function() {
            this.setState({ hideDimmer: true });
        }.bind(this), 600);
    },

    appInstallDidFail: function(instInfo) {
        switch (instInfo.error) {
            case "ERROR_SECURITY_ACCESS_DENIED":
                this.setState({
                    dimmerTitle: "Error",
                    dimmerMessage: "You are not allowed to install offline APPs."
                });
                break;
            case "ERROR_APP_BAD_FILE_FORMAT":
            case "ERROR_APP_BAD_STRUCT":
                this.setState({
                    dimmerTitle: "Error",
                    dimmerMessage: "Not a supported APP format."
                });
                break;
            default:
                this.setState({
                    dimmerTitle: "Error",
                    dimmerMessage: instInfo.error
                });
                break;
        }
    },

    appWillCancelInstall: function(instInfo) {
        this.setState({
            dimmerTitle: "Cancelling...",
            dimmerMessage: "Wait for cancelling installation."
        });
    },

    appDidCancelInstall: function(instInfo) {
        this.setState({
            dimmerTitle: "Cancelled",
            dimmerMessage: "You cancelled installation."
        });
    },

    appCancelInstallDidFail: function(instInfo) {

    },

    appWillUninstall: function(uninstInfo) {

    },

    appDidUninstall: function(uninstInfo) {

    },

    appUninstallDidFail: function(uninstInfo) {

    }
};

var OfflineAppCard = React.createClass({

    mixins: [ AppManagerAgentMixin ],

    propTypes: {
        id:              React.PropTypes.string.isRequired,
        name:            React.PropTypes.string.isRequired,
        imageURL:        React.PropTypes.string,
        group:           React.PropTypes.string,
        description:     React.PropTypes.string,
        onCancelInstall: React.PropTypes.func.isRequired,
        onRemoveCard:    React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            hideDimmer: false,
            hideDimmerButton: false,
            dimmerTitle: "Waiting...",
            dimmerMessage: "",
            installProgress: 0,
        };
    },

    componentWillMount: function () {
        AppManagerAgent.attach(this);
    },

    componentDidMount: function() {
        ShopStore.addChangeListener(this._onInstallChanges);
    },

    componentWillUnmount: function () {
        AppManagerAgent.detach(this);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return true;
    },

    componentDidUpdate: function(prevProps, prevState) {

    },

    _onInstallChanges: function(change) {

    },

    _onButtonClick: function() {
        if (this.state.dimmerTitle === "Error" || this.state.dimmerTitle === "Cancelled")
            this.props.onRemoveCard(this.props.id);
        else {
            if (this.props.onCancelInstall(this.props.id)) {
                this.setState({
                    dimmerTitle: "Cancelled",
                    dimmerMessage: "You cancelled installation."
                });
            }
        }
    },

    render: function() {
        var randomColor = APP_COLORS[Math.floor(Math.random() * APP_COLORS.length)];
        var imageURL    = this.props.imageURL ? this.props.imageURL : "/apps/b/shop/img/install-wait.png";
        var description = this.props.description ? this.props.description : "";
        var dimmerClass = this.state.hideDimmer ? "ui dimmer" : "ui active dimmer";
        var buttonTitle;
        var progressbarClass;

        if (this.state.dimmerTitle === "Error") {
            buttonTitle = "Remove";
            progressbarClass = "ui progress error";
        }
        else if (this.state.dimmerTitle === "Cancelled") {
            buttonTitle = "Remove";
            progressbarClass = "ui progress warning";
        }
        else {
            buttonTitle = "Cancel";
            progressbarClass = "ui green progress";
        }

        return (
            <div className={"ui " + randomColor + " card"}>
                <div className={dimmerClass}>
                    <div className="content">
                        <div className="center">
                            <div className="ui inverted header">
                                {this.state.dimmerTitle}
                            </div>
                            <p>&nbsp;{this.state.dimmerMessage}&nbsp;</p>
                            <div className={progressbarClass}>
                                <div className="bar" style={{width: (this.state.installProgress + "%")}}></div>
                            </div>
                            <div className="ui red button"
                                     style={{display: (this.state.hideDimmerButton ? "none" : "inline-block")}}
                                   onClick={this._onButtonClick}>
                                {buttonTitle}
                            </div>
                        </div>
                    </div>
                </div>
                <a className="image">
                    <img className="ui image" src={imageURL} />
                </a>
                <div className="content">
                    <a className="header">{this.props.name}</a>
                    <div className="meta">
                        <a>{this.props.group}</a>
                    </div>
                    <div className="description">
                        {description}
                    </div>
                </div>
            </div>
        );
    }
});

var ShopSectionMyApp = React.createClass({
    getDefaultProps: function() {
        return {};
    },

    propTypes: {

    },

    getInitialState: function() {
        return {
            list: []
        };
    },

    componentWillMount: function() {

    },

    componentDidMount: function() {
        //$(".section-myapp-scroller").niceScroll({
        //    touchbehavior: true,
        //    cursorwidth: '0px'
        //});

        /*
        if ($('.section-myapp-cards').width() <= $(window).width()) {
            $('.section-myapp-scroll-forward').hide();
            $('.section-myapp-scroll-back').hide();
        }

        $(window).resize(function() {
            if ($('.section-myapp-cards').width() > $(window).width()) {
                $('.section-myapp-scroll-forward').show();
                $('.section-myapp-scroll-back').show();
            }
            else {
                $('.section-myapp-scroll-forward').hide();
                $('.section-myapp-scroll-back').hide();
            }
        });

        function scrollBack() {
            //$('.section-myapp-scroll-forward').show();
            $('.section-myapp-scroll-back').unbind('click');
            $('.section-myapp-scroller').animate({
                scrollLeft: '-=350'
            }, 500, function() {
                if ($('.section-myapp-scroller').scrollLeft() <= 0) {
                    //$('.section-myapp-scroll-back').hide();
                    $('.section-myapp-scroller').scrollLeft(0);
                }
                $('.section-myapp-scroll-back').bind('click', scrollBack);
            });
        }

        function scrollForward() {
            //$('.section-myapp-scroll-back').show();
            $('.section-myapp-scroll-forward').unbind('click');
            $('.section-myapp-scroller').animate({
                scrollLeft: '+=350'
            }, 500, function() {
                if ($('.section-myapp-scroller').scrollLeft() >= $('.section-myapp-cards').width() - $('.section-myapp-scroller').width()) {
                    //$('.section-myapp-scroll-forward').hide();
                    $('.section-myapp-scroller').scrollLeft($('.section-myapp-cards').width() - $('.section-myapp-scroller').width());
                }
                $('.section-myapp-scroll-forward').bind('click', scrollForward);
            });
        }

        //$('.section-myapp-scroll-back').hide();
        $('.section-myapp-scroll-back').click(scrollBack);
        $('.section-myapp-scroll-forward').click(scrollForward);
        */
    },

    componentWillUnmount: function() {

    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return true;
    },

    componentWillUpdate: function(nextProps, nextState) {

    },

    componentDidUpdate: function(prevProps, prevState) {
        /* Programmatically adjust .card container's width */
        $('.section-myapp-cards').width($('.card').length * ($('.card').width() + 16));
    },

    installOfflineApp: function() {
        var files = $('#file')[0].files;
        var list = this.state.list;

        $('#file').replaceWith($('#file').clone());

        for (var i = 0; i < files.length; i++) {
            list.unshift(files[i]);
            files[i].instid = AppManagerAgent.install(files[i]);
        }

        if (files.length > 0)
            this.setState({ list: list });
    },

    cancelOfflineApp: function(instid) {
        return AppManagerAgent.cancelInstall(instid);
    },

    removeFailedApp: function(instid) {
        var list = this.state.list;

        for (var i = 0; i < list.length; i++) {
            if (list[i].instid === instid) {
                list.splice(i, 1);
                this.setState({ list: list });
                return;
            }
        }
    },

    render: function() {
        var myAppCards = this.state.list.map(function(file, i) {
            return (
                <OfflineAppCard key={file.instid}
                                 id={file.instid}
                               name={file.name}
                              group="Chardi"
                    onCancelInstall={this.cancelOfflineApp}
                       onRemoveCard={this.removeFailedApp} />
            );
        }, this);

        return (
            <div className="ui segment">
                <h2 className="ui left floated header">My Applications</h2>
                <div className="ui clearing divider"></div>
                <div className="section-myapp-container">

                    <input type="file"
                             id="file"
                          style={{display: "none"}}
                       onChange={this.installOfflineApp} multiple />

                    <div className="section-myapp-scroll-back">
                        <i className="left huge chevron icon"></i>
                    </div>

                    <div className="section-myapp-scroll-forward">
                        <i className="right huge chevron icon"></i>
                    </div>

                    <div className="section-myapp-scroller">
                        <ReactCSSTransitionGroup component="div"
                                            transitionName="card"
                                                 className="ui link cards section-myapp-cards">
                            <label htmlFor="file" className="ui pink card">
                                <a className="image">
                                    <img className="ui image" src="/apps/b/shop/img/install-offline.png" />
                                </a>
                                <div className="content">
                                    <a className="header">Install Offline App</a>
                                    <div className="meta">
                                        <a>&nbsp;</a>
                                    </div>
                                    <div className="description">
                                        Install application from local storage.
                                    </div>
                                </div>
                            </label>

                            {myAppCards}

                        </ReactCSSTransitionGroup>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = ShopSectionMyApp;
