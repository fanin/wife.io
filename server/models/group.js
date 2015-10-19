var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Group = new Schema({
  name: { type: String, required: true, trim: true, index: { unique: true } },
  description: { type: String }
});

module.exports = mongoose.model('Group', Group);
