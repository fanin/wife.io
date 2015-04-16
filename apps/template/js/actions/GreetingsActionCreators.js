var GreetingsDispatcher = require('../dispatcher/GreetingsDispatcher');
var GreetingsExtension  = require('../extension/greetings');
var GreetingsConstants  = require('../constants/GreetingsConstants');

var GreetingsActionCreators = {

    loadExtension: function() {
        ExtensionAgent.load(GreetingsExtension);
    },

    unloadExtension: function() {
        ExtensionAgent.unload(GreetingsExtension);
    },

    sayHello: function(from, to) {
        GreetingsDispatcher.dispatch({
            actionType: GreetingsConstants.GREETINGS_SAY_HELLO
        });

        GreetingsExtension.sayHello(from, to, function(msg, err) {
            if (msg)
                GreetingsDispatcher.dispatch({
                    actionType: GreetingsConstants.GREETINGS_SAY_HELLO_SUCCESS,
                    msg: msg
                });
            else
                GreetingsDispatcher.dispatch({
                    actionType: GreetingsConstants.GREETINGS_SAY_HELLO_FAIL,
                    msg: err
                });
        });
    }
}

module.exports = GreetingsActionCreators;
