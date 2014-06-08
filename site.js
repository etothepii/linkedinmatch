var express = require('express')
  , socketio = require('socket.io')
  , passport = require('passport')
  , LinkedInStrategy = require('passport-linkedin-oauth2').Strategy
  , path = require('path')
  , http = require("http")
  , cheerio = require("Cheerio")
  , Linkedin = require('node-linkedin')('api', 'secret', 'callback')
  , util = require('util');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});  

passport.use(
  new LinkedInStrategy(
    {
      clientID: '77mdaohplf6gnr',
      clientSecret: 'oz9WvPLOQN4ebokr',
      callbackURL: "http://localhost:4000/auth/linkedin/callback",
      scope: ['r_network','r_fullprofile']
    }, function(accessToken, refeshToken, user, done) {
      user.accessToken = accessToken
      process.nextTick(function() {
        return done(null, user);
      });
    }
  )
);  

var app = express.createServer();

app.configure(function() {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'kasdljcnalrkhgrtluvaernclaruh' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

function processConnection(linkedin, connection) {
  if (connection.id == 'private' || !connection.pictureUrl) {
    return;
  }
  console.log(JSON.stringify(connection));
  linkedin.people.id(connection.id, ['public-profile-url'], function(err, profile) {
    if (err) {
      console.error(err);
      return;
    }
    processPublicProfile(linked, {
      id: connection.id,
      firstName: connection.firstName,
      lastName: connection.lastName,
      pictureUrl: connection.pictureUrl,
      publicProfileUrl: profile.publicProfileUrl
    });
  });
}

function processPublicProfile(linked, profile) {
}

app.get('/', function(req, res) {
  if (req.user) {
    console.log("req.user.accessToken: " + req.user.accessToken);
    var linkedin = Linkedin.init(req.user.accessToken);
    linkedin.connections.retrieve(function(err, connections) {
      for (var i = 0; i < connections.values.length && i < 1; i++) {
        var connection = connections.values[i];
	console.log("Getting connection: " + i);
        processConnection(linkedin, connection);
      }
    });  
  }
  else {
    console.log("req.user: undefined");
  }
  res.render(
    'index', 
    { 
      user: req.user,
        profile: req.profile
    });
});

app.get('/auth/linkedin', 
  passport.authenticate('linkedin', { state: 'some_state' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/auth/linkedin/callback', 
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(4000);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login')
}
