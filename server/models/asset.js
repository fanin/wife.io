var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Asset = new Schema({
  assetid: { type: String, required: true, trim: true, index: { unique: true } },
  name: { type: String, required: true, trim: true },
  vendor: { type: String },
  model: { type: String },
  serial: { type: String },
  owner: { type: String },
  acquisition_date: { type: Date },
  warranty_expiration_date: { type: Date },
  description: { type: String }
});

module.exports = mongoose.model('Asset', Asset);
