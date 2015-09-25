var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
  firstname: { type: String, required: true, trim: true },
  lastname: { type: String, required: true, trim: true },
  group: { type: String, default: 'User' },
  gender: { type: Boolean, required: true },
  active: { type: Boolean, required: true, default: true },
  expiration_date: { type: Date }
});

User.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameQueryFields: [ 'email' ]
});

module.exports = mongoose.model('User', User);
