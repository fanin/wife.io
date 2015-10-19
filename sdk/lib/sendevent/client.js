var events = [];

export function on(url, handle) {

  if (typeof url == 'function') {
    handle = url
    url = '/eventstream'
  }

  /**
   * Iframe-fallback for browsers that don't support EventSource.
   */
  function createIframe() {
    var doc = document

    // On IE use an ActiveXObject to prevent the "throbber of doom"
    // see: http://stackoverflow.com/a/1066729
    if (window.ActiveXObject) {
      doc = new ActiveXObject("htmlfile")
      doc.write('<html><body></body></html>')

      // set a global variable to prevent the document from being garbage
      // collected which would close the connection:
      window.eventStreamDocument = doc

      // Expose a global function that can be invoked from within the iframe:
      doc.parentWindow.handleSentEvent = handle

      appendIframe(doc, url)
    }
    else {
      // Most likely an old Android device. The trick here is not to send
      // the 4KB padding, but to immediately reload the iframe afer a message
      // was received.
      window.handleSentEvent = handle
      setTimeout(function() { appendIframe(document, url+'?close') }, 1000)
    }
  }

  function appendIframe(doc, url) {
    var i = doc.createElement('iframe')
    i.style.display = 'none'
    i.src = url
    doc.body.appendChild(i)
  }

  var init = function() {
    if (!events[url]) {
      events[url] = {
        source: new EventSource(url),
        handlers: [ handle ]
      }
      events[url].source.onmessage = function(ev) {
        events[url].handlers.forEach(function(handle) {
          handle(JSON.parse(ev.data))
        })
      }
    }
    else {
      events[url].handlers.push(handle);
    }
  }

  if (!window.EventSource) init = createIframe

  init();

  //if (window.attachEvent) attachEvent('onload', init)
  //else addEventListener('load', init)
}

export function off(url, handle) {
  if (events[url]) {
    events[url].handlers = events[url].handlers.filter(function(f) {
      return f !== handle;
    });
  }
}
