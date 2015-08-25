module.exports = {
  timestamp: function() {
    var now = new Date();
    return now.getFullYear()
        + ("0" + (now.getMonth() + 1)).slice(-2)
        + ("0" + now.getDate()).slice(-2)
        + ("0" + now.getHours()).slice(-2)
        + ("0" + now.getMinutes()).slice(-2)
        + ("0" + now.getSeconds()).slice(-2)
        + ("0" + now.getMilliseconds()).slice(-2);
  },

  randomDigit: function(digit) {
    return ("0" + Math.floor(Math.random() * Math.pow(10, digit))).slice(-digit);
  },

  /**
   * Generate random string from template.
   * Replace for placeholder "X" in template.
   * return template if not has placeholder.
   *
   * @param {String} template template string.
   * @throws {TypeError} if template is not a String.
   * @return {String} replaced string.
   */
  randomString: function(template) {
    /* random table string and table length. */
    var TABLE = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        TABLE_LEN = TABLE.length;

    var match, i, len, result;

    if (typeof template !== 'string') {
      throw new TypeError('template must be a String: ' + template);
    }

    match = template.match(/(X+)[^X]*$/);

    // return template if not has placeholder
    if (match === null) {
      return template;
    }

    // generate random string
    for (result = '', i = 0, len = match[1].length; i < len; ++i) {
      result += TABLE[Math.floor(Math.random() * TABLE_LEN)];
    }

    // concat template and random string
    return template.slice(0, match.index) + result +
      template.slice(match.index + result.length);
  },

  uniqueString: function() {
    return this.timestamp() + this.randomDigit(4);
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
