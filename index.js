const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose  = require('mongoose');
let bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  user_id:{type:String, required:true},
  description: {type:String},
  duration: { type: Number },
  date: {type:Date}
});

const userSchema = new Schema({
  username: { type: String, required: true }
});

let User =  mongoose.model("User", userSchema);
let Exercise =  mongoose.model("Exercise", exerciseSchema);

app.post("/api/users", bodyParser.urlencoded({ extended: false }), userRes);

async function userRes(req,res){
  const insertarUser= { username:req.body.username };
  const result= await User.create(insertarUser);
  res.json({
    username:result.username,
    _id:result._id
  })
};

app.post("/api/users/:_id/exercises", bodyParser.urlencoded({ extended: false }), exerciseRes);

async function exerciseRes(req,res){
  if(!req.body.date){
    req.body.date=new Date();
  }
  const insertarExercise= { user_id:req.params._id, description:req.body.description, duration:req.body.duration, date:req.body.date };
  const resultEx= await Exercise.create(insertarExercise);
  const resultUser= await User.findById(req.params._id);
  const dateForm=new Date(resultEx.date).toDateString();
  res.json({
    _id:resultUser._id,
    username:resultUser.username,
    date:dateForm,
    duration:resultEx.duration,
    description:resultEx.description,
  })
};

app.get("/api/users", getAllUsers);

async function getAllUsers(req,res){
  const result= await User.find({}).select("_id username");
  res.json(result);
}

app.get("/api/users/:_id/logs", getAllLogs);

async function getAllLogs(req,res){
  const { from, to, limit }=req.query;
  let dateObj={};
  if(from){
    dateObj["$gte"]=new Date(from);
  }
  if(to){
    dateObj["$lte"]=new Date(to);
  }
  let filter={
    user_id:req.params._id
  }
  if(from||to){
    filter.date=dateObj;
  }
  const userResult= await User.findById(req.params._id).select("_id username");
  const logResult= await Exercise.find(filter).limit(+limit ?? 500);
  const log= logResult.map(e=>({
    description:e.description,
    duration:e.duration,
    date:e.date.toDateString(),
  }))
  res.json({
    _id:userResult._id,
    username:userResult.username,
    count:logResult.length,
    log:log
  });
}
