var express = require('express')
var multer  = require('multer')  ;
const bodyParser = require('body-parser');
var upload = multer({ dest: 'uploads/' });
var app = express();
app.use(bodyParser.json());
var cors = require('cors') ;
app.use(bodyParser.raw({ type: () => true }));
var mongoose = require('mongoose');
var passport = require('passport');
var Schema = mongoose.Schema;
app.use(cors());
app.set('view engine', 'html');
var path = require('path');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
mongoose.connect('mongodb://localhost/login', function () {
    console.log('Mongoose connected SuccessFully');
});
mongoose.Promise = require('bluebird');
var UserSchema = new Schema({
    name: String,
    image:{type: String},
    email: {
        type: String,
        lowercase: true,
    },
    facebook: {},
    twitter: {},
    google: {},
    github: {}
});
let User  =  mongoose.model('User', UserSchema);


passport.use(new GoogleStrategy({
        clientID: "593611705954-lankjeksjgevmpfg3gkkfujnqtf2hj4v.apps.googleusercontent.com",
        clientSecret: "EpE099TgkMjOp1jaPGwQB2mv",
        callbackURL: "http://localhost:3000/auth/google/callback"
    },
    function(request, accessToken, refreshToken, profile, done) {
        User.findOne({name: profile.name}).exec().then(function (user) {
            if(user) return done();
            return userData.save().then(function (user) {
                console.log('user', user);
                return done(null);
            })
        })
    }
));
passport.use(new FacebookStrategy({
    clientID: "448299312330514",
    clientSecret: "e73f9c3be24b2dbeecc61b2b31c4bdbe",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
    },

    function(accessToken, refreshToken, profile){
    console.log(profile, profile.displayName);
       return insertUser(profile, done);
    }
));

function insertUser(profile, done){
    User.findOne({name: profile.displayName}).exec().then(function (user) {
        console.log('Found User', user);
        if(user) return done(null);
        let userData = new User({
            name:profile.displayName
        })
        return userData.save().then(function (user) {
            console.log('user', user);
            return done(null);
        })
    })
}

app.post('/profile', function (req, res, next) {
    let userData  = new User(req.body);
    userData.save().then(function (user) {
       res.send('User Saved');
    })
});

app.put('/:id',upload.single('file'), function (req, res) {
    User.findById(req.params.id).exec().then(function (user) {
       if(!user) return res.status(500).send('User Not Found');
       for(let i in req.body){
           user[i] = req.body[i];
       }
       user.save().then(function (user) {
         return  res.send(user);
       })
    })
})  ;

app.get('/user', function (req, res) {
      User.find({}).exec().then(function (users) {
         res.send(users);
      })
});


app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'https://mail.google.com/']}
));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/user');
  });


app.get('/auth/facebook',
    passport.authenticate('facebook'),
    function(req, res){
       console.log('Facebook Auth Calling');
    });
app.get('/auth/facebook/callback',
    passport.authenticate('facebook',function(req, res) {
        console.log('Going To Redirect');
        res.sendFile( '/index.html');
    })
);

app.listen(3000);
