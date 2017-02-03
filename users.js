var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = new Schema({
  
  userName: { type: String, unique: true, required: [true, 'UserName field is empty. It\'s a required field.'] },
  exercises: [{
    type: Schema.Types.ObjectId,
    ref: 'exercises'
  }]
}, { emitIndexErrors: true });

var userErrorsHandler = function(error, res, next) {
  console.log("ERRORS: USERS", error);
  let errorai = "";
  for (let err in error.errors){
    if (error.errors[err].name === 'ValidatorError')
      errorai += error.errors[err].message;
    if (error.errors[err].name === 'CastError')
    {
      errorai += `Wrong ${err}: ${error.errors[err].stringValue}. It must be a valid ${(error.errors[err].kind).toLowerCase()} value.<br />`;
      
    }
  } 
  if (errorai.length > 0){
    next(new Error(errorai));
  } else 
  if (error.name === 'CastError'){
            console.log('blogai?')
     next(new Error(`Wrong user _id: ${error.stringValue} Please check your user _id.<br />`));
  }else 
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Username already taken.'));
  } else {
    next();
  }
};

usersSchema.post('findOne', userErrorsHandler);
usersSchema.post('save', userErrorsHandler);
usersSchema.post('update', userErrorsHandler);
usersSchema.post('findOneAndUpdate', userErrorsHandler);
usersSchema.post('insertMany', userErrorsHandler);

module.exports = function (db){
  return db.model('users', usersSchema);
};

