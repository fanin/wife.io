var ShopActionCreators = require("../actions/ShopActionCreators");
var ShopStore          = require("../stores/ShopStore");

var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var APP_COLORS = [
	"blue", "green", "orange", "pink", "purple", "red", "teal", "yellow"
];

/* TODO */
var UserAppInfoModal = React.createClass({

	propTypes: {
		appname: React.PropTypes.string.isRequired
	},

	getDefaultProps: function() {
		return {};
	},

	render: function() {
		return (
			<div>
			</div>
		);
	}
});


var UserAppCard = React.createClass({

	propTypes: {
		file:        React.PropTypes.object.isRequired,
		imageSrc:    React.PropTypes.string,
		group:       React.PropTypes.string,
		description: React.PropTypes.string
	},

	getDefaultProps: function() {
		return {
			imageSrc: "/apps/ia/shop/img/install-wait.png",
			group: "Default"
		};
	},

	getInitialState: function() {
		return {
			hideDimmer: false,
			dimmerTitle: "Waiting...",
			dimmerMessage: ""
		};
	},

	componentDidMount: function() {
		ShopStore.addChangeListener(this.onShopChange);
		ShopActionCreators.install(this.props.file);
	},

	componentWillUnmount: function() {
		ShopStore.removeChangeListener(this.onShopChange);
	},

	render: function() {
		var installer   = ShopStore.getInstaller(this.props.file.xhr);
		var progress    = installer ? installer.progress : 0;
		var randomColor = APP_COLORS[Math.floor(Math.random() * APP_COLORS.length)];
		var imageSrc    = this.props.imageSrc;
		var description = this.props.description;
		var dimmerClass = this.state.hideDimmer ? "ui dimmer" : "ui active dimmer";
		var filename    = this.props.file.name;
		var group       = this.props.group;
		var prgbarClass = (installer && installer.status === "uploading")
												? "ui tiny green progress" : "hidden";
		var dimmerBtnClass;
		var dimmerBtnIconClass;

		if (installer && installer.status === "error") {
			dimmerBtnClass = "ui circular red icon button";
			dimmerBtnIconClass = "icon trash";
		}
		else if (installer && installer.status === "aborted") {
			dimmerBtnClass = "ui circular red icon button";
			dimmerBtnIconClass = "icon trash";
		}
		else if (installer && installer.status === "uploading") {
			dimmerBtnClass = "ui circular red icon button";
			dimmerBtnIconClass = "fa fa-hand-stop-o";
		}
		else if (installer && (installer.status === "installed" ||
		         							 installer.status === "upgraded")) {
			dimmerBtnClass = "ui circular green icon button";
			dimmerBtnIconClass = "icon checkmark";
		}
		else
			dimmerBtnClass = "hidden";

		return (
			<div className={"ui " + randomColor + " card"}>
				<div className={dimmerClass}>
					<div className="content">
						<div className="center">
							<div className="ui inverted header">
								{this.state.dimmerTitle}
							</div>
							{ /*<p>&nbsp;{this.state.dimmerMessage}&nbsp;</p>*/ }
							<div className={dimmerBtnClass} onClick={this.onButtonClick}>
								<i className={dimmerBtnIconClass} />
							</div>
							<div className={prgbarClass}>
								<div className="bar" style={{width: (progress + "%")}}></div>
							</div>
						</div>
					</div>
				</div>
				<a className="image">
					<img className="ui image" src={imageSrc} />
				</a>
				<div className="content">
					<a className="userapp header">{filename}</a>
					<div className="meta">
						<a>{group}</a>
					</div>
					<div className="description">
						{description}
					</div>
				</div>
			</div>
		);
	},

	onButtonClick: function() {
		var _installer = ShopStore.getInstaller(this.props.file.xhr);

		if (_installer.status === "error" || _installer.status === "aborted")
			ShopActionCreators.removeInstall(this.props.file.xhr);
		else if (_installer.status === "uploading")
			ShopActionCreators.abortInstall(this.props.file.xhr);
	},

	onShopChange: function() {
		var _installer = ShopStore.getInstaller(this.props.file.xhr);

		if (!_installer)
			return;
		else if (_installer.status === "uploading")
			this.setState({
				dimmerTitle: "Wait...",
				dimmerMessage: "Uploading app package..."
			});
		else if (_installer.status === "installing")
			this.setState({
				dimmerTitle: "Wait...",
				dimmerMessage: "Installing app package..."
			});
		else if (_installer.status === "installed")
			this.setState({
				dimmerTitle: "Success!",
				dimmerMessage: "App installed successfully."
			});
		else if (_installer.status === "upgraded")
			this.setState({
				dimmerTitle: "Success!",
				dimmerMessage: "App upgraded successfully."
			});
		else if (_installer.status === "aborted")
			this.setState({
				dimmerTitle: "Failed!",
				dimmerMessage: "Installation aborted."
			});
		else if (_installer.status === "error")
			this.setState({
				dimmerTitle: "Failed!",
				dimmerMessage: "Unable to install app (Error: "
				                  + _installer.error.message + ")."
			});

		if (_installer.status === "installed" || _installer.status === "upgraded") {
			setTimeout(function() {
				this.setState({ hideDimmer: true });
			}.bind(this), 2000);
		}
	}
});

var ShopSectionMyApp = React.createClass({

	getInitialState: function() {
		return {
			appFiles: []
		};
	},

	componentDidMount: function() {
		ShopStore.addCleanListener(this.onShopClean);
	},

	componentDidUpdate: function(prevProps, prevState) {
		/* Programmatically adjust .card container"s width */
		$(".section-myapp-cards").width($(".card").length * ($(".card").width() + 16));
	},

	componentWillUnmount: function() {
		ShopStore.removeCleanListener(this.onShopClean);
	},

	installUserApp: function() {
		var files = $("#file")[0].files;
		var pkgs = this.state.appFiles;

		for (let i = 0; i < files.length; i++)
			pkgs.push(files[i]);

		this.setState({ appFiles: pkgs });

		$("#file").replaceWith($("#file").clone());
	},

	render: function() {
		var appCards = this.state.appFiles.map(function(file) {
			return <UserAppCard key={file.name} file={file} />;
		});

		return (
			<div className="ui segment">
				<h2 className="ui left floated header">My Applications</h2>
				<div className="ui clearing divider"></div>
				<div className="section-myapp-container">

					<input
						type="file"
						id="file"
						style={{display: "none"}}
					  onChange={this.installUserApp}
					  multiple
					/>

					<div className="section-myapp-scroller">
						<ReactCSSTransitionGroup
							component="div"
							transitionName="card"
							className="ui link cards section-myapp-cards"
						>
							<label htmlFor="file" className="ui pink card">
								<a className="image">
									<img
										className="ui image"
										src="/apps/ia/shop/img/install-offline.png"
									/>
								</a>
								<div className="content">
									<a className="header">Install App Package</a>
									<div className="meta">
										<a>&nbsp;</a>
									</div>
								</div>
							</label>

							{appCards}

						</ReactCSSTransitionGroup>
					</div>
				</div>
			</div>
		);
	},

	onShopClean: function() {
		var files = this.state.appFiles.filter(function(file) {
			return (ShopStore.getInstaller(file.xhr) != null);
		});

		this.setState({ appFiles: files });
	}
});

module.exports = ShopSectionMyApp;
