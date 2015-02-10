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

GreetingsExtension.on('greetings.sayhello#success', dispatchGreetingsMsg);
GreetingsExtension.on('greetings.sayhello#error', dispatchGreetingsErrMsg);

var GreetingsActions = {
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

module.exports = GreetingsActions;
