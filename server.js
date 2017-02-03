'use strict';

//Minusai:
//Per daug dideli blokai .. 
//Reiktu issiaiskinti daugiau apie errorHandlery: kaip ji iskviesti, kai klaida paprasta, kaip kad user = null

//Pliusai:
//Daugelis klaidu pagaunamos paciu klasiu

// Good links:
//http://jaketrent.com/post/mongoose-population/
//https://www.youtube.com/watch?v=5_pvYIbyZlU

//+ {"username":"Bananasgg","_id":"rJcjhplue"}
//+{"username":"Bananas","description":"ddfasd","duration":34,"_id":"SJbugbxux","date":"Tue Oct 20 2015"}
//+{"username":"gardemarin","description":"Bedalagas","duration":45,"_id":"HkOBrKk_l","date":"Fri May 05 2000"}
//+unknown _id
//+Path `duration` is required.
//+Path `description` is required.
//+Cast to Date failed for value "2000--5" at path "date" (jeigu data neikalama tai irasoma now Date)

//Have _id
// +/-{"_id":"HkOBrKk_l","username":"gardemarin","count":4,"log":[{"description":"drd","duration":3,"date":"Wed Feb 01 2017"},{"description":"Bedalagas","duration":45,"date":"Fri May 05 2000"},{"description":"Bedalagas","duration":45,"date":"Fri May 05 2000"},{"description":"drd","duration":3,"date":"Fri May 05 2000"}]}

//Have _id and from
// +/-{"_id":"HkOBrKk_l","username":"gardemarin","from":"Thu Jan 01 2015","count":1,"log":[{"description":"drd","duration":3,"date":"Wed Feb 01 2017"}]}

//Have _id and limit=2
// +/-{"_id":"HkOBrKk_l","username":"gardemarin","count":2,"log":[{"description":"drd","duration":3,"date":"Wed Feb 01 2017"},{"description":"Bedalagas","duration":45,"date":"Fri May 05 2000"}]}

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');
var mongoose    = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var User       = require('./users.js');
var Exercise   = require('./exercises.js');

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');

var options, db;
var app = express();

if ('development' == process.env.NODE_ENV){
  options = { promiseLibrary: require('bluebird') };
  db = mongoose.createConnection(process.env.DB, options);
}
var UserTable = new User(db);
var ExerciseTable = new Exercise(db);
app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: true })

app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});
app.route('/api/exercise/log/:user?').get(function(req, res){
  getUserData(req.params.user, req.query, res);
});

app.post('/api/exercise/new-user', urlencodedParser, function (req, res) {
 if (!req.body) return res.sendStatus(400);
  
  var user = new UserTable();
  user.userName = req.body.userName;

  user.save(function (err, user) {
    if (!err)
      res.json(user);
    else {
      res.send('Errors:<br /> '+ err.message);
    }
  });
});


app.post('/api/exercise/add', urlencodedParser, function (req, res) {
 if (!req.body) return res.sendStatus(400);
 var data = req.body;
 var error;
 var exercise = new ExerciseTable();
 
 if (req.body.exerciseDate){
   exercise.date = req.body.exerciseDate;
 }
 if (req.body.duration) {
   exercise.duration = req.body.duration;
 }
 if (req.body.description) 
   exercise.description = req.body.description;
//       db.model('users').findOne({ _id: req.body.userId}, function(err, user) {
      UserTable.findOne({ _id: req.body.userId}, function(err, user) {
        if (!err) {
          if (user !== null){
            
            exercise.save(function (err, savedExercise) {
            if (!err){
            
              user.exercises.push(exercise._id);

              user.save(function(err, updatedObject) {
                if (!err){
                  UserTable.findOne(
                    { 
                      _id: req.body.userId
                    }
                  ).populate(
                    {
                      path: 'exercises',
                      match: { _id: { $eq: exercise._id}},
                      select: '_id description duration date',
                    }
                  ).exec(function(err, data){
                    if (!err){
                      res.json({ _id: data.exercises[0]._id,
                         username: data.userName,
                         description: data.exercises[0].description,
                         duration: data.exercises[0].duration,
                         date: data.exercises[0].date.toDateString()
                      }); //res.json
                    } else { // if (!err)
                      res.send('Errors:<br /> '+ err.message);
                    }
                   }); //.exec
                } else { // if (!err)
                  res.send('Errors:<br /> '+ err.message);
                }
              }); //user.save
            } else {
              res.send('Errors:<br /> '+ err.message);
             }
           }); //exercise.save
            
          } else { 
            res.send('Errors: <br />User don\'t exist!');
          }
        } else { // if (!err)
          res.send('Errors:<br /> '+ err.message);
        }

      }); //db.model('users').findOne
});//app.post


app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

//Start our server
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
});

module.exports = app; //for testing

function getUserData(user, options, res){
  let queryMatch = 
  (   
    options.from&&options.to&&
    {
      date: { 
        $gte: new Date(options.from),
        $lte: new Date(options.to)
      }
    }
  )||  
  (   
    options.from&&(!options.to)&&
    {
      date: { 
        $gte: new Date(options.from),
      }
    }
  )||  
  (   
    (!options.from)&&(options.to)&&
    {
      date: { 
        $lte: new Date(options.to)
      }
    }
  )||{};
  
  UserTable.findOne(
    { 
      _id: user
    } 
  ).populate(
    {
      path: 'exercises',
      match: queryMatch,
      select: 'description duration date',
      options: { 
        limit: parseInt(options.limit)
      }
    }
  ).exec(function(err, data){
    if (!err){
      let exercises = [];
      data.exercises.map(function(exercise)
        {
          exercises.push({
            description: exercise.description,
            duration: exercise.duration,
            date: (exercise.date).toDateString()
          })
        }
      );
      res.json({
        _id: data._id,
        username: data.userName,
        exercises: exercises
      });
    } else { // if (!err)
      res.send('Errors:<br /> '+ err.message);
    }      
   }); //.exec
}