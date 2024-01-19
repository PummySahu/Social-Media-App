var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/instagram')

var userSchema = mongoose.Schema({
  username : String,
  password : String,
  name: String,
  email : String,
  age: Number,
  about: String,
  image : {
    type: String,
    default: "def.png"
    },
  posts:[
    {type: mongoose.Schema.Types.ObjectId,
    ref: 'post'}
  ],

  key: String,
  keyExpire: Date
})
userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('user', userSchema);
