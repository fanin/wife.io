'use strict';

var mdns = require('mdns');

class NetServAdvertiser {

  constructor(props) {
    this.name = props.name || 'Unnamed MDNS Service';
    this.port = props.port || 80;
    this.serviceType = props.serviceType || mdns.tcp('http');
    this.txtRecord = props.txtRecord;
    this.advertiser = mdns.createAdvertisement(
      this.serviceType,
      this.port,
      {
        name: this.name,
        txtRecord: this.txtRecord
      }
    );
  }

  static serviceType(name, proto) {
    return mdns.makeServiceType({
      name: name,
      protocol: proto
    });
  }

  start() {
    this.advertiser.start();
  }

  stop() {
    this.advertiser.stop();
  }
}

module.exports = NetServAdvertiser;
