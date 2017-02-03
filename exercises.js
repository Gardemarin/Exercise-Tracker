var mongoose = require('mongoose');
var Schema = mongoose.Schema;

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function replacer(match, p1, p2, p3, offset, string) {
  return p2;
}

function addZeros(value, count){
  return (count > value.length && value.length !== 0)
    ? ("0".repeat(count - value.length) + value)
    : value;
}

function formateDate(v){
  let data = v.split('-');
  let year = addZeros(data[0].replace(/(0*)([1-9]\d*)/, replacer), 4);
  let month = addZeros((data[1]||'01').replace(/(0*)(\d+)/, replacer), 2);
  let day = addZeros((data[2]||'01').replace(/(0*)(\d+)/, replacer), 2);
  return new Date(`${year}-${month}-${day}`);
}

var exercisesSchema = new Schema({
  description: { 
      type: String,
      trim: true,
      required: [true, 'Description is missing: it is a required field.<br />']
  },
  duration: {
      type: Number,
      trim: true,
      required: [true, 'Duration is missing: it is a required field.<br />'],
      validate: [function(v){ return /^\d+$/.test(v)}, 'Wrong duration: "{VALUE}". It must be an integer and greater than 0.<br />']
  },
    date: {
      type: Date,
      default:  new Date(),
      trim: true,
      set: formateDate
    }
});

var errorHandler = function(error, res, next) {
  console.log("ERRORS: EXERCISES", error);
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
  } else {
    next();
  }
  
};
exercisesSchema.post('save', errorHandler);
exercisesSchema.post('update', errorHandler);
exercisesSchema.post('findOneAndUpdate', errorHandler);
exercisesSchema.post('insertMany', errorHandler);

module.exports = function (db){
  return db.model('exercises', exercisesSchema);
};