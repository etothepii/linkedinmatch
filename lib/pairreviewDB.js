var orm = require("orm");

exports.connect = function (after) {
  var password;
  password = process.env.PAIRREVIEW_DB_PASSWORD;
  connectToDatabase(password, orm);
  after();
}

function connectToDatabase(password, orm) {
  orm.connect("mysql://" + process.env.PAIRREVIEW_DB_USERNAME + ":" + password + "@localhost/" + process.env.DATABASE, function (err, db) {
    if (err) throw err;
    buildORM(db);
  });
}

var skill;
var user;
var comparison;
var connection;
var skills;

function buildORM(db) {
  skill = db.define("skill", {
    id: Number,
    name: String
  });
  exports.Skill = skill;
  user = db.define("user", {
    id: String,
    firstName: String,
    lastName: String,
    pictureUrl: String,
    skillsUpdated: Date,
    played: Boolean
  });
  exports.User = user;
  connection = db.define("connections", {
    id: Number,
  });
  exports.Connection = connection;
  connection.hasOne("person", user, {reverse:"connections"});
  connection.hasOne("connection", user);
  skills = db.define("skills", {
    id: Number,
  });
  exports.Skills = skills;
  skills.hasOne("person", user, {reverse:"skills"});
  skills.hasOne("skill", skill, {reverse:"peopleWithIt"});
  comparison = db.define("comparison", {
    id: Number,
    score: Number,
  });
  exports.Comparison = comparison;
  comparison.hasOne("left", user, {reverse:"leftComparisons"});
  comparison.hasOne("right", user, {reverse:"rightComparisons"});
  comparison.hasOne("skill", user, {reverse:"comparisons"});
  comparison.hasOne("user", user, {reverse:"comparisons"});
}
