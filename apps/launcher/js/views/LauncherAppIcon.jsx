var LauncherAppIcon = React.createClass({
    propTypes: {
        appType: React.PropTypes.string.isRequired,
        manifest: React.PropTypes.object.isRequired,
        manageable: React.PropTypes.bool
    },

    componentDidMount: function() {
        document.getElementById('launcher-icon-div-' + this.props.manifest.identifier).draggable = false;
        document.getElementById('launcher-icon-img-' + this.props.manifest.identifier).draggable = false;
        document.getElementById('launcher-icon-text-' + this.props.manifest.identifier).draggable = false;
    },

    render: function() {
        var iconAHref = '/apps/' + this.props.appType + '/' + this.props.manifest.directory + '/' + this.props.manifest.entry;

        var iconDivStyle = (this.props.appType === 'ua') ? {
            backgroundImage:
                'url(/apps/u/' + this.props.manifest.directory + '/img/icon.png) no-repeat; background-size: contain;'
        } : {};

        var iconImgStyle = {
            width: '100%',
            height: '100%'
        };

        var iconImgSrc = '/apps/' + this.props.appType + '/' + this.props.manifest.directory + '/img/icon.png';

        return (
            <li key = {this.props.manifest.identifier}
                 id = {'launcher-icon-li-' + this.props.manifest.identifier}>

                <div className = {this.props.manageable ? 'shake-app' : ''}>

                    <a title = {(this.props.manageable && this.props.appType === 'ua')
                                ? 'Uninstall ' + this.props.manifest.name
                                : this.props.manifest.description}
                          id = {'launcher-icon-a-' + this.props.manifest.identifier}
                        href = {this.props.manageable ? '#' : iconAHref}>

                        <div style = {iconDivStyle}
                                id = {'launcher-icon-div-' + this.props.manifest.identifier}>

                            <img style = {iconImgStyle}
                                    id = {'launcher-icon-img-' + this.props.manifest.identifier}
                                   src = {iconImgSrc} />

                            <div className = 'launcher-overlay-icon-delete'
                                        id = {'launcher-overlay-icon-div-' + this.props.manifest.identifier}
                                     style = {{display: (this.props.appType === 'ua' && this.props.manageable) ? 'block' : 'none'}}>

                                <img src = 'img/delete-icon.png'
                                      id = {'launcher-overlay-icon-img-' + this.props.manifest.identifier} />
                            </div>

                        </div>

                        <span id = {'launcher-icon-text-' + this.props.manifest.identifier}>
                            {this.props.manifest.name}
                        </span>

                    </a>

                </div>

            </li>
        );
    }
});

module.exports = LauncherAppIcon;
