var prdb;

exports.setDB = function(db) {
  prdb = db;
}

exports.getRandomComparison = function(data, next) {
  getMultiTryRandomComparison(data, next, 0);
}

function getMultiTryRandomComparison(data, next, attempt) {
  console.log("data.user.id: " + data.user.id);
  prdb.User.find({id: data.user.id}, function(err, children) {
    if (err) {
      console.error("Unable to find user");
      console.error(err);
      return next(data);
    }   
    if (attempt > 9) {
      console.error("Failed to find user in database 10 times");
      return next(data);
    }
    if (children.length == 0) {
      return setTimeout(
        getMultiTryRandomComparison(data, next, attempt + 1),
	1000);
    }
    getRandomComparissonWithDbuser(data, children[0], next, attempt);
  });
}

function getRandomComparissonWithDbuser(data, dbUser, next, attempt) {
  prdb.Connection.find({person_id: dbUser.id}, function (err, connections) {
    if (err) {
      console.error("Unable to find user");
      console.error(err);
      return next(data);
    }   
    if (attempt > 9) {
      console.error("Failed to find any connections");
      return next(data);
    }
    console.log("dbUser.id: " + JSON.stringify(dbUser.id));
    if (connections.length == 0) {
      return setTimeout(
        getRandomComparissonWithDbuser(data, dbUser, next, attempt + 1),
	1000);
    }
    getRandomElement(connections).getConnection(function(err, left) {
      left.getSkills(function(err, skills) {
        if (err) {
          console.error("Error finding skills");
          console.error(err);
          return next(data);
        }
	if (skills.length == 0) {
	  return getRandomComparissonWithDbuser(data, dbUser, next, attempt + 1)
	}
        var skillJoin = getRandomElement(skills);
	skillJoin.getSkill(function(err, skill) {
          skill.getPeopleWithIt(function (err, peopleWithIt) {
            if (err) {
              console.error("Error finding skills");
              console.error(err);
              return next(data);
            }
	    if (peopleWithIt.length == 0) {
	      return getRandomComparissonWithDbuser(data, dbUser, next, attempt + 1)
	    }
            getRandomElement(peopleWithIt).getPerson(function(err, right) {
	      if (left.id == right.id) {
	        return getMultiTryRandomComparison(data, next, attempt + 1);
	      }
	      data.comparisson = {
	        left_id: left.id,
		left_name: left.firstName + " " + left.lastName,
		left_url: left.pictureUrl,
		right_id: right.id,
		right_name: right.firstName + " " + right.lastName,
		right_url: right.pictureUrl,
		skill_id: skill.id,
		skill_name: skill.name,
		user_id: dbUser.id
	      }
	      data.comparisson.returnHref = getReturnHref(data.comparisson)
              next(data);
	    });
          });
        });
      });
    });  
  });
}

function getReturnHref(comparisson) {
  return '/index?left_id='+comparisson.left_id+'&'+
  'right_id='+comparisson.right_id+'&'+
  'skill_id='+comparisson.skill_id+'&'+
  'user_id='+comparisson.user_id+'&score='
}

function getRandomElement(list) {
  return list[(Math.random() * list.length)|0];
}

