var GreetingsDispatcher    = require('../dispatcher/GreetingsDispatcher');
var GreetingsExtension     = require('../extension/greetings');
var GreetingsConstants     = require('../constants/GreetingsConstants');
var DiligentActionCreators = DiligentAgent.actions;

function dispatchGreetingsMsg(msg) {
    GreetingsDispatcher.dispatch({
        actionType: GreetingsConstants.GREETINGS_SAY_HELLO_SUCCESS,
        msg: msg
    });
}

function dispatchGreetingsErrMsg(msg) {
    GreetingsDispatcher.dispatch({
        actionType: GreetingsConstants.GREETINGS_SAY_HELLO_FAIL,
        msg: msg
    });
}

var GreetingsActionCreators = {
    register: function() {
        GreetingsExtension.on('greetings.sayhello#success', dispatchGreetingsMsg);
        GreetingsExtension.on('greetings.sayhello#error', dispatchGreetingsErrMsg);
    },

    unregister: function() {
        GreetingsExtension.removeListener('greetings.sayhello#success', dispatchGreetingsMsg);
        GreetingsExtension.removeListener('greetings.sayhello#error', dispatchGreetingsErrMsg);
    },

    loadExtension: function() {
        DiligentActionCreators.loadExtension(GreetingsExtension);
    },

    unloadExtension: function() {
        DiligentActionCreators.unloadExtension(GreetingsExtension);
    },

    sayHello: function(from, to) {
        GreetingsDispatcher.dispatch({
            actionType: GreetingsConstants.GREETINGS_SAY_HELLO
        });

        GreetingsExtension.sayHello(from, to);
    }
}

module.exports = GreetingsActionCreators;
