var LauncherAppIcon = React.createClass({
    propTypes: {
        appType: React.PropTypes.string.isRequired,
        manifest: React.PropTypes.object.isRequired,
        manageable: React.PropTypes.bool
    },

    componentDidMount: function() {
        document.getElementById('launcher-icon-div-' + this.props.manifest.directory).draggable = false;
        document.getElementById('launcher-icon-img-' + this.props.manifest.directory).draggable = false;
        document.getElementById('launcher-icon-text-' + this.props.manifest.directory).draggable = false;
    },

    render: function() {
        var iconAHref = '/apps/' + this.props.appType + '/' + this.props.manifest.directory + '/' + this.props.manifest.entry;

        var iconDivStyle = (this.props.appType === 'u') ? {
            backgroundImage:
                'url(/apps/u/' + this.props.manifest.directory + '/img/icon.png) no-repeat; background-size: contain;'
        } : {};

        var iconImgStyle = {
            width: '100%',
            height: '100%'
        };

        var iconImgSrc = '/apps/' + this.props.appType + '/' + this.props.manifest.directory + '/img/icon.png';

        return (
            <li id={'launcher-icon-li-' + this.props.manifest.directory} key={this.props.manifest.directory}>
                <a id    = {'launcher-icon-a-' + this.props.manifest.directory}
                   href  = {this.props.manageable ? '#' : iconAHref}
                   title = {(this.props.manageable && this.props.appType === 'u') ?
                            'Uninstall ' + this.props.manifest.name :
                            this.props.manifest.description}>

                    <div id        = {'launcher-icon-div-' + this.props.manifest.directory}
                         style     = {iconDivStyle}
                         className = {this.props.manageable ? 'shake-app' : ''}>

                        <img id    = {'launcher-icon-img-' + this.props.manifest.directory}
                             style = {iconImgStyle}
                             src   = {iconImgSrc} />

                        <div id        = {'launcher-overlay-icon-div-' + this.props.manifest.directory}
                             className = 'launcher-overlay-icon-delete'
                             style     = {{display: (this.props.appType === 'u' && this.props.manageable) ? 'block' : 'none'}}>

                            <img id  = {'launcher-overlay-icon-img-' + this.props.manifest.directory}
                                 src = 'img/delete-icon.png'/>
                        </div>
                    </div>
                    <span id = {'launcher-icon-text-' + this.props.manifest.directory}>
                        {this.props.manifest.name}
                    </span>
                </a>
            </li>
        );
    }
});

module.exports = LauncherAppIcon;
