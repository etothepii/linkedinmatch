var express = require('express')
  , socketio = require('socket.io')
  , passport = require('passport')
  , LinkedInStrategy = require('passport-linkedin-oauth2').Strategy
  , path = require('path')
  , http = require("http")
  , cheerio = require("Cheerio")
  , Linkedin = require('node-linkedin')('api', 'secret', 'callback')
  , prdb = require('./lib/pairreviewDB')
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
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "http://" + process.env.REALM + "/auth/linkedin/callback",
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
  app.use(express.session({ secret: process.env.EXPRESS_SECRET }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

function processConnection(linkedin, connectedToId, connection) {
  console.log("Processing: " + connection.id);
  if (connection.id == 'private' || !connection.pictureUrl) {
    return;
  }
  var connectionJoining = {PERSON: connectedToId, CONNECTION: connection.id};
  prdb.Connection.find(connectionJoining, function(err, children) {
    if (err) {
      console.error("Failed to find connection joining");
      return console.error(err);
    }
    if (children.length == 0) {
      prdb.Connection.create(connectionJoining, function(err) {
        if (err) {
          console.error("Failed to create connection joining");
          return console.error(err);
	}
	console.log("Created connection: " + JSON.stringify(connectionJoining));
      });
    }
  });
  linkedin.people.id(connection.id, ['public-profile-url'], function(err, profile) {
    if (err) {
      console.error("Failed to find person by id");
      console.error(err);
      return;
    }
    var publicProfile = {
      id: connection.id,
      firstName: connection.firstName,
      lastName: connection.lastName,
      pictureUrl: connection.pictureUrl,
      publicProfileUrl: profile.publicProfileUrl,
      loggedin: false
    }
    processProfile(linkedin, publicProfile);
  });
}

function download(url, callback) {
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}

function executeProfileIfMayHaveBeenUpdated(profile, next) {
  prdb.User.find({ID: profile.id}, function (err, children) {
    if (err) {
      console.error("Error finding user");
      return console.error(err);
    }
    if (children.length > 0) {
      var weekAhead = new Date();
      weekAhead.setDate(children[0].SKILLS_UPDATED.getDate() + 7);
      if (weekAhead > new Date()) {
        console.log("No need to update as updated in the last 7 days: " 
	        + children[0].ID);
        return;
      }
    }
    next(profile, children);
  });
}

function processProfile(linkedin, profile) {
  executeProfileIfMayHaveBeenUpdated(profile, function(profile, dbProfiles) { 
    if (profile.loggedin) {
      return updateProfile(profile, dbProfiles, profile.loggedin);
    }
    download(profile.publicProfileUrl, function(data) {
      var $ = cheerio.load(data);
      profile.skills = {values: []};
      $("ol.skills>li").each(function (i, e) {
        profile.skills.values.push({name: $(e).text().trim()});
      });
      updateProfile(profile, dbProfiles, profile.loggedin);
    });
  });
}

function updateProfile(profile, dbProfile, playing) {
  console.log("Updating profile: " + profile.id);
  prdb.User.find({ID: profile.id}, function(err, children) {
    if (children.length == 0) {
      return addToDatabase(profile, playing);
    }
    else if (children.length > 1) {
      return console.error("Found more than one value with the same primary key");
    }
    children[0].SKILLS_UPDATED = new Date();
    children[0].save(function (err) {
      if (err) {
        console.error("Saving skills update time failed");
        console.error(err);
      }
    });
    updateSkills(profile, children[0].ID)
  });
}

function addToDatabase(profile, loggedIn) {
  console.log("Creating profile: " + profile.id);
  var user = {
    ID: profile.id,
    FIRST_NAME: profile.firstName,
    LAST_NAME: profile.lastName,
    PICTURE_URL: profile.pictureUrl,
    SKILLS_UPDATED: new Date(),
    PLAYED: loggedIn
  }
  console.log("Saving user: " + profile.id);
  prdb.User.create(user, function (err, created) {
    if (err) {
      console.error("Failed to create User");
      return console.error(err);
    }
    console.log("Created user: " + created.ID);
    updateSkills(profile, created.ID);
  });
}

function seekSkill(skill, dbProfileId) {
  prdb.Skill.find({NAME: skill}, function(err, found) {
    if (err) {
      console.error("Unable to find skill, " + skill);
      return console.error(err);
    }
    if (found.length == 0) {
      prdb.Skill.create({NAME: skill}, function(err, created) {
	  console.log("Created skill: " + skill);
        if (err) {
          return console.error("Unable to save: " + skill);
        }
        addSkill(dbProfileId, created.ID);
      });
    }
    else {
      addSkill(dbProfileId, found[0].ID);
    }
  });
}

function updateSkills(profile, dbProfileId) {
  for (var i = 0; i < profile.skills.values.length; i++) {
    seekSkill(profile.skills.values[i].name, dbProfileId);
  }
}

function addSkill(profileId, skillId) {
  var skill = {PERSON: profileId, SKILL: skillId};
  prdb.Skills.find(skill, function (err, found) {
    if (err) {
      console.error("Failed to find skill: " + JSON.stringify(skill));
      return console.error(err);
    }
    if (found.length == 0) {
      prdb.Skills.create(skill, function(err, items) {
        if (err) {
          return console.error("Failed to save: " + JSON.stringify(skill));
        }
      });
    }
  });  
}

app.get('/', function(req, res) {
  var evaluatedProfile;
  if (req.user) {
    var linkedin = Linkedin.init(req.user.accessToken);
    evaluatedProfile = eval("(" + req.user._raw + ")"); 
    evaluatedProfile.loggedin = true;
    processProfile(linkedin, evaluatedProfile);
    linkedin.connections.retrieve(function(err, connections) {
      for (var i = 0; i < connections.values.length; i++) {
        var connection = connections.values[i];
        processConnection(linkedin, evaluatedProfile.id, connection);
      }
    });  
  }
  var data = {
    user: req.user,
    profile: evaluatedProfile
  }
  if (req.user) {
    getRandomComparison(data, function(data) {  
      res.render('index', data);
    });
  }
  else {
    res.render('index', data);
  }
});

function getRandomComparison(data, next) {
  console.log("data.user.id: " + data.user.id);
  prdb.User.find({ID: data.user.id}, function(err, children) {
    if (err) {
      console.error("Unable to find user");
      console.error(err);
      return;
    }
    console.log("children: " + JSON.stringify(children));
    //getRandomComparisonWithDBUser(data, next, children);
  });
}

function getRandomComparisonWithDBUser(data, next, dbUser) {
  var connection = dbUser.connections;
  console.log("connections.length: " + connections.length);
  next(data);
}

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

prdb.connect(function() {
  app.listen(process.env.SITE_PORT);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login')
}
