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
    }
}
