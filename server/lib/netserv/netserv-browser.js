'use strict';

var mdns = require('mdns');

class NetServBrowser {

  constructor(props) {
    this.defaultHandler = (s) => {};
    this.serviceType = props.serviceType || mdns.tcp('http');
    this.onServiceUp = props.onServiceUp || this.defaultHandler;
    this.onServiceDown = props.onServiceDown || this.defaultHandler;
  }

  static serviceType(name, proto) {
    return mdns.makeServiceType({
      name: name,
      protocol: proto
    });
  }

  start() {
    this.browser = mdns.createBrowser(this.serviceType);

    this.browser.on('serviceUp', (service) => {
      this.onServiceUp(service);
    });

    this.browser.on('serviceDown', (service) => {
      this.onServiceDown(service);
    });

    this.browser.start();
  }

  stop() {
    if (this.browser)
      this.browser.stop();
  }
}

module.exports = NetServBrowser;
