var async   = require('async');
var apiutil = require('utils/apiutil');

var AppMainView = React.createClass({

    getDefaultProps: function () {
        return {
            categories: [
                {
                    name: 'Storage API',
                    apiMethod: 'GET',
                    apiBaseURL: '/api/v1/storage'
                },
                {
                    name: 'App API',
                    apiMethod: 'GET',
                    apiBaseURL: '/api/v1/apps'
                },
                {
                    name: 'File System API',
                    apiMethod: 'GET',
                    apiBaseURL: '/api/v1/fs'
                }
            ]
        };
    },

    getInitialState: function() {
        return {
            testCategory: 0,
            testItem: 0,
            apiMethod: '',
            apiBaseURL: '',
            apiTargetURL: '',
            testResults: []
        };
    },

    componentDidMount: function() {
        apiutil.on('/api/v1/storage/sse', function(ev) {
            console.log(ev);
        });

        this.setState({
            testCategory: 0,
            testItem: 0,
            apiMethod: this.props.categories[0].apiMethod,
            apiBaseURL: this.props.categories[0].apiBaseURL,
            apiTargetURL: '',
            apiPostData: null,
            testResults: []
        })
    },

    render: function() {
        var _categoryMenuItems = this.props.categories.map(function(test, index) {
            return (
                <a className = { this.state.testCategory === index ? "active item" : "item" }
                     onClick = {
                        function() {
                            this.setState({
                                testCategory: index,
                                testItem: 0,
                                apiMethod: test.apiMethod,
                                apiBaseURL: test.apiBaseURL,
                                apiTargetURL: '',
                                apiPostData: null,
                                testResults: []
                            })
                        }.bind(this)
                    }>
                    {test.name}
                </a>
            );
        }.bind(this));

        var _manualTestForm,
            _testTypeItems = [],
            _onManualTest = function() { this.setState({ testItem: 0, apiTargetURL: '', testResults: [] }) }.bind(this),
            _onAutoTest = function() { this.setState({ testItem: 1, apiTargetURL: '', testResults: [] }) }.bind(this),
            _manualTestApiURL = this.state.apiBaseURL + this.state.apiTargetURL,
            _postData = this.state.apiPostData
                        ? ' [' + (this.state.apiPostData.name
                                    ? this.state.apiPostData.name
                                    : this.state.apiPostData) + ']'
                        : '';

        switch (this.state.testCategory) {
        case 0:
            if (this.state.testItem === 0) {
                _manualTestForm = (
                    <div className="manual-form">
                        <div className="ui fluid input">
                            <input placeholder="Storage UUID or '*'"
                                          type="text"
                                      onChange={this.updateGetStorageAPIURL}
                                       onFocus={this.updateGetStorageAPIURL}
                                        />
                        </div>
                        <div className="ui info message">
                            <div className="header">
                                API REQUEST STRING:
                            </div>
                            <p>{ this.state.apiMethod + ' ' +  _manualTestApiURL + ' ' + _postData }</p>
                        </div>
                    </div>
                );
            }
            else {
                _manualTestForm = (
                    <button className="ui button" onClick = { function() { this.autoTestStorage() }.bind(this) }>
                        Start
                    </button>
                );
            }
            break;
        case 1:
            if (this.state.testItem === 0) {
                _manualTestForm = (
                    <div className="ui container">
                        <table className="ui definition table">
                            <tbody>
                                <tr>
                                    <td className="five wide column">Get Apps</td>
                                    <td>
                                        <div className="ui transparent input">
                                            <input placeholder="App ID or '*'"
                                                          type="text"
                                                      onChange={this.updateGetAppAPIURL}
                                                       onFocus={this.updateGetAppAPIURL} />
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Install App</td>
                                    <td>
                                        <div className="ui action input">
                                            <label htmlFor="appfile" className="ui button">
                                                Browse APP package
                                            </label>

                                            <input type="file" id="appfile"
                                                  style={{display: "none"}}
                                               onChange={this.updateUploadAppAPIURL} />
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Installation Status</td>
                                    <td>
                                        <div className="ui transparent input">
                                            <input type="text" placeholder="Install ID..."
                                               onChange={this.updateInstallStatusAPIURL}
                                                onFocus={this.updateInstallStatusAPIURL} />
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Uninstall App</td>
                                    <td>
                                        <div className="ui transparent input">
                                            <input type="text" placeholder="App ID..."
                                               onChange={this.updateDeleteAppAPIURL}
                                                onFocus={this.updateDeleteAppAPIURL} />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="ui info message">
                            <div className="header">
                                API REQUEST STRING:
                            </div>
                            <p>{ this.state.apiMethod + ' ' +  _manualTestApiURL + ' ' + _postData }</p>
                        </div>
                    </div>
                );
            }
            else {
                _manualTestForm = (
                    <button className="ui button" onClick = { function() { this.autoTestApp() }.bind(this) }>
                        Start
                    </button>
                );
            }
            break;
        case 2:
            if (this.state.testItem === 0) {
                _manualTestForm = null;
            }
            else {
                _manualTestForm = (
                    <button className="ui button" onClick = { function() { this.autoTestFileSystem() }.bind(this) }>
                        Start
                    </button>
                );
            }
            break;
        }

        _testTypeItems.push(
            <a className={this.state.testItem === 0 ? "active item" : "item"}
                 onClick={_onManualTest}>Manual Test</a>
        );

        _testTypeItems.push(
            <a className={this.state.testItem === 1 ? "active item" : "item"}
                 onClick={_onAutoTest}>Auto Test</a>
        );

        var resultTable = this.state.testResults.map(function(test, index) {
            return (
                <tr className={ index === 0 ? "positive" : "" }>
                    <td className="five wide column">{test.api}</td>
                    <td><pre>{test.result}</pre></td>
                </tr>
            );
        });

        return (
            <div>
                <div className="greetings">
                    <div className="ui pointing menu">
                        {_categoryMenuItems}
                    </div>
                    <div className="ui segment">
                        <div className="ui two item menu">
                            {_testTypeItems}
                        </div>

                        <p>&nbsp;</p>

                        <div className="ui horizontal divider">
                            <i className="options icon"></i>
                            &nbsp;Test Form
                        </div>

                        {_manualTestForm}

                        <button className="ui button"
                                    style={{display: this.state.testItem === 0 ? "inline-block" : "none"}}
                                  onClick={this.sendApiRequest}>Send</button>

                        <div className="ui horizontal divider">
                            <i className="bar chart icon"></i>
                            &nbsp;Test Result
                        </div>

                        <table className="ui definition table">
                            <tbody>
                                {resultTable}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    },

    updateGetStorageAPIURL: function(e) {
        var targetURL = (!e.target.value.trim() || e.target.value.trim() === "*")
                        ? "" : "/" + e.target.value.trim();

        this.setState({
            apiMethod: "GET",
            apiTargetURL: targetURL,
            apiPostData: null
        });
    },

    updateGetAppAPIURL: function(e) {
        var targetURL = (!e.target.value.trim() || e.target.value.trim() === "*")
                        ? "" : "/" + e.target.value.trim();

        this.setState({
            apiMethod: "GET",
            apiTargetURL: targetURL,
            apiPostData: null
        });
    },

    updateUploadAppAPIURL: function(e) {
        this.setState({
            apiMethod: "UPLOAD",
            apiTargetURL: "/install",
            apiPostData: e.target.files[0]
        });
    },

    updateInstallStatusAPIURL: function(e) {
        this.setState({
            apiMethod: "GET",
            apiTargetURL: "/install/" + e.target.value,
            apiPostData: null
        });
    },

    updateDeleteAppAPIURL: function(e) {
        this.setState({
            apiMethod: "DELETE",
            apiTargetURL: "/" + e.target.value + "?keepUserData=0",
            apiPostData: null
        });
    },

    handleSuccess: function(response, data) {
        var tests = this.state.testResults;

        tests.unshift({
            api: response.method + ' ' + response.requestURL,
            result: data
                ? (typeof data === 'object'
                    ? JSON.stringify(data, null, 2)
                    : data)
                : response.code + ' ' + response.message
        });

        this.setState({ testResults: tests });
    },

    handleError: function(error) {
        var tests = this.state.testResults;

        tests.unshift({
            api: error.method + ' ' + error.requestURL,
            result: error.code + ' ' + error.message
        });

        this.setState({ testResults: tests });
    },

    sendApiRequest: function() {
        var self = this,
            apiURL = this.state.apiBaseURL + this.state.apiTargetURL;

        if (self.state.apiMethod === "GET") {
            apiutil.get(apiURL, function(response, data) {
                self.handleSuccess(response, data);
            }, function(error) {
                self.handleError(error);
            });
        }
        else if (self.state.apiMethod === "UPLOAD") {
            apiutil.upload(apiURL, self.state.apiPostData, function(response, data) {
                self.handleSuccess(response, data);
            }, function(error) {
                self.handleError(error);
            }, function(progress, response) {
                self.handleSuccess({ progress: progress }, response);
            });
        }
        else if (self.state.apiMethod === "DELETE") {
            apiutil.delete(apiURL, function(response, data) {
                self.handleSuccess(response, data);
            }, function(error) {
                self.handleError(error);
            });
        }
    },

    autoTestStorage: function() {
        var self = this;
        var disks;

        async.series([
            function(callback) {
                apiutil.get('/api/v1/storage', function(response, data) {
                    disks = data;
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },
            function(callback) {
                apiutil.get('/api/v1/storage/' + disks[0].uuid, function(response, disk) {
                    self.handleSuccess(response, disk);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },
            function(callback) {
                apiutil.get('/api/v1/storage/0000', function(response, disk) {
                    self.handleSuccess(response, disk);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            }
        ]);
    },

    autoTestApp: function() {
        var self = this;
        var apps;

        this.setState({ testItem: 1, testResults: [] });

        async.series([
            function(callback) {
                apiutil.get('/api/v1/apps', function(response, data) {
                    apps = data;
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },
            function(callback) {
                apiutil.get('/api/v1/apps/' + apps[0].identifier, function(response, manifest) {
                    self.handleSuccess(response, manifest);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            }
        ]);
    },

    testAppInstallApi: function() {
        var self = this;
        var files = $('#appfile')[0].files;
        var instid;

        //$('#appfile').replaceWith($('#appfile').clone());

        for (var i = 0; i < files.length; i++) {
            async.series([
                function(callback) {
                    apiutil.upload('/api/v1/apps/install', files[i], function(response, data) {
                        instid = data;
                        self.handleSuccess(response, data);
                        callback(null, true);
                    }, function(error) {
                        self.handleError(error);
                        callback(null, true);
                    }, function(progress, response) {
                        self.handleSuccess({ progress: progress }, response);
                    });
                },
                function(callback) {
                    apiutil.get('/api/v1/apps/install/' + instid, function(response, data) {
                        self.handleSuccess(response, data);
                        callback(null, true);
                    }, function(error) {
                        self.handleError(error);
                        callback(null, true);
                    });
                }
            ]);
        }
    },

    testAppUninstallApi: function() {
        var self = this;

        apiutil.get('/api/v1/apps', function(apps) {
            apps.every(function(app) {
                if (app.name === 'Greetings' || app.name === 'Hello') {
                    apiutil.delete('/api/v1/apps/' + app.identifier + '?keepUserData=0', function(response, data) {
                        self.handleSuccess(response, data);
                    }, function(error) {
                        self.handleError(error);
                    });
                }
                return true;
            });
        });
    },

    autoTestFileSystem: function() {
        var self = this;

        this.setState({ testItem: 1, testResults: [] });

        async.series([
            function(callback) {
                apiutil.upload('/api/v1/fs/file/' + encodeURIComponent('hello/world/readme.txt'), new Blob(['this is first line'], { type : 'text/plain' }), function(response, data) {
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },
            function(callback) {
                apiutil.get('/api/v1/fs/file/' + encodeURIComponent('hello/world/readme.txt'), function(response, data) {
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                }, function(progress) {
                    console.log(progress);
                });
            },
            function(callback) {
                apiutil.upload('/api/v1/fs/file/' + encodeURIComponent('hello/world/readme.txt') + '?append=1', new Blob(['\nthis is second line'], { type : 'text/plain' }), function(response, data) {
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },
            function(callback) {
                apiutil.get('/api/v1/fs/grep/' + encodeURIComponent('hello/world/readme.txt') + '/' + encodeURIComponent('.*line.*') + '?encoding=ascii&regex_modifier=gi&match_only=1&test_only=0&parse_format=0', function(response, data) {
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },
            function(callback) {
                apiutil.post('/api/v1/fs/ln/' + encodeURIComponent('hello/world/readme.txt') + '/' + encodeURIComponent('hello/world/readme2.txt') + '?symbolic=1', null, function(response, data) {
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },
            function(callback) {
                apiutil.get('/api/v1/fs/wget/' + encodeURIComponent('hello/google.png') + '/' + encodeURIComponent('https://www.google.com.tw/images/nav_logo195_hr.png'), function(response, data) {
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },
            /*function(callback) {
                apiutil.download('/api/v1/fs/file/' + encodeURIComponent('hello/google.png'), function(response, data) {
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            },*/
            function(callback) {
                apiutil.delete('/api/v1/fs/file/hello', function(response, data) {
                    self.handleSuccess(response, data);
                    callback(null, true);
                }, function(error) {
                    self.handleError(error);
                    callback(null, true);
                });
            }
        ]);
    }
});

module.exports = AppMainView;
