module.exports = {
	getTimecode: function() {
        var now = new Date();
        return now.getFullYear()
                + ("0" + (now.getMonth() + 1)).slice(-2)
                + ("0" + now.getDate()).slice(-2)
                + ("0" + now.getHours()).slice(-2)
                + ("0" + now.getMinutes()).slice(-2)
                + ("0" + now.getSeconds()).slice(-2)
                + ("0" + now.getMilliseconds()).slice(-2);
    },

    getRandomValue: function(digit) {
        return ("0" + Math.floor(Math.random() * Math.pow(10, digit))).slice(-digit);
    },

    generateUID: function() {
        return this.getTimecode() + this.getRandomValue(4);
    },

    truncate: function(str, max, sep) {
        max = max || 10;
        var len = str.length;
        if(len > max) {
            sep = sep || "...";
            var seplen = sep.length;
            if(seplen > max) { return str.substr(len - max) }

            var n = -0.5 * (max - len - seplen);
            var center = len / 2;
            return str.substr(0, center - n) + sep + str.substr(len - center + n);
        }
        return str;
    }
}
