var _callbacks = [];

module.exports = {
    queueApiCallback: function(name, index, cb) {
        if (!cb) return;
        _callbacks[name] = _callbacks[name] || [];
        _callbacks[name][index] = _callbacks[name][index] || [];
        _callbacks[name][index].unshift(cb);
    },

    dequeueApiCallback: function(name, index, onComplete) {
        if (!onComplete) return;
        _callbacks[name] = _callbacks[name] || [];
        if (_callbacks[name][index] && _callbacks[name][index].length > 0) {
            var cb = _callbacks[name][index][_callbacks[name][index].length - 1];
            if (onComplete(cb))
                _callbacks[name][index].pop();
        }
    },

    dequeueAllApiCallback: function(name, index, onComplete) {
        if (!onComplete) return;
        _callbacks[name] = _callbacks[name] || [];
        for (var i = _callbacks[name][index].length - 1; i >= 0; i--)
            if (onComplete(_callbacks[name][index][i]))
                _callbacks[name][index].pop();
    }
}
