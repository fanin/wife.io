module.exports = {
  base64ToBlob: function(base64str, contentType) {
    var blob;
    try {
      // decode base64 string, remove space for IE compatibility
      var binary = atob(base64str.replace(/\s/g, ''));

      // get binary length
      var len = binary.length;

      // create ArrayBuffer with binary length
      var buffer = new ArrayBuffer(len);

      // create 8-bit Array
      var view = new Uint8Array(buffer);

      // save unicode of binary data into 8-bit Array
      for (var i = 0; i < len; i++) {
        view[i] = binary.charCodeAt(i);
      }

      // create the blob object with content-type
      blob = new Blob([view], { type: contentType });
    }
    catch (error) {
      blob = new Blob([]);
    }

    return blob;
  }
}
