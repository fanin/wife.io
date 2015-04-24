'use strict';

var FileAgent = {
    init: function() {
        global.FileAgent = DiligentAgent.getClient().fileManager;
    },

    deinit: function() {
        global.FileAgent = null;
    },
};

module.exports = FileAgent;
