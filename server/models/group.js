var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Group = new Schema({
  name: { type: String, required: true, trim: true, index: { unique: true } }
});

module.exports = mongoose.model('Group', Group);
