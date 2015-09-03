import sse from 'sendevent';
import { timestamp } from './common/string-misc';

export default {

  get: function(url, callbacks = {}) {
    $.ajax({
      type: 'GET',
      url: url,
      async: true,
      timeout: 15000,
      xhrFields: {
        onprogress: function(event) {
          if (event.lengthComputable) {
            callbacks.progress && callbacks.progress(
              event.target,
              Math.round(100 * event.loaded / event.total)
            );
          }
        }
      },
      success: function(data, status, xhr) {
        data = (data != xhr.statusText) ? data : null;
        callbacks.success && callbacks.success(xhr, data);
      },
      error: function(xhr) {
        if (xhr.status !== 401)
          callbacks.error && callbacks.error(xhr);
      }
    });
  },

  post: function(url, data, callbacks = {}) {
    $.ajax({
      type: 'POST',
      url: url,
      async: true,
      timeout: 15000,
      data: data,
      success: function(data, status, xhr) {
        callbacks.success && callbacks.success(xhr);
      },
      error: function(xhr) {
        if (xhr.status !== 401)
          callbacks.error && callbacks.error(xhr);
      }
    });
  },

  put: function(url, data, callbacks = {}) {
    $.ajax({
      type: 'PUT',
      url: url,
      async: true,
      timeout: 15000,
      data: data,
      success: function(data, status, xhr) {
        callbacks.success && callbacks.success(xhr);
      },
      error: function(xhr) {
        if (xhr.status !== 401)
          callbacks.error && callbacks.error(xhr);
      }
    });
  },

  delete: function(url, callbacks = {}) {
    $.ajax({
      type: 'DELETE',
      url: url,
      async: true,
      timeout: 15000,
      success: function(data, status, xhr) {
        callbacks.success && callbacks.success(xhr);
      },
      error: function(xhr) {
        if (xhr.status !== 401)
          callbacks.error && callbacks.error(xhr);
      }
    });
  },

  download: function(url, callbacks = {}) {
    url += (url.indexOf('?') > 0 ? '&' : '?') + 'download=1';
    $.cookie('fileDownload', 'true', { path: '/' });
    $.fileDownload(url, {
      successCallback: function(url) {
        callbacks.success && callbacks.success(
          { status: 200, statusText: 'OK' }
        );
      },
      failCallback: function(responseHtml, url) {
        callbacks.error && callbacks.error(
          { status: 500, statusText: 'File download error' }
        );
      }
    });
  },

  upload: function(url, data, options, callbacks = {}) {
    if (!(data instanceof Blob)) {
      callbacks.error && callbacks.error(
        { status: 415, statusText: 'Data is not an instance of Blob' }
      );
      return;
    }

    var ts = timestamp();

    $('<input type="file" id="__upload_' + ts + '" />').hide().appendTo('body');

    var formData = new FormData();
    formData.append('__upload_' + ts, data);

    $.ajax({
      type: 'POST',
      url: url,
      async: true,
      timeout: 15000,
      data: formData,
      contentType: false,
      processData: false,
      success: function(data, status, xhr) {
        $('#__upload_' + ts).remove();
        data = (data != xhr.statusText) ? data : null;
        callbacks.success && callbacks.success(xhr, data);
      },
      error: function(xhr) {
        $('#__upload_' + ts).remove();
        if (xhr.status !== 401)
          callbacks.error && callbacks.error(xhr);
      },
      xhrFields: options.xhrFields,
      xhr: function() {
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener("progress", function(event) {
          if (event.lengthComputable) {
            callbacks.progress && callbacks.progress(
              xhr,
              Math.round(100 * event.loaded / event.total)
            );
          }
        }, false);
        return xhr;
      }
    });
  },

  abort: function(xhr) {
    xhr && xhr.abort();
  },

  on: sse,

  include: function(url) {
    return new Promise(function(resolve, reject) {
      var ext = url.split('.').pop();

      if (ext === 'js') {
        $.ajax({
          url: url,
          dataType: 'script',
          async: true,
          success: function(data) { resolve(data) },
          error: function(error) {
            reject('Could not load script ' + url);
          }
        });
      }
      else if (ext === 'css') {
        $.ajax({
          url: url,
          dataType: 'text',
          async: true,
          success: function(data) {
            $('<style type="text/css">\n' + data + '</style>').appendTo('head');
            resolve(data);
          }
        });
      }
    });
  }
};
