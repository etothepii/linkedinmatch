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
  skill = db.define("Skill", {
    ID: Number,
    NAME: String
  },{
    id: "ID"
  });
  exports.Skill = skill;
  user = db.define("User", {
    ID: String,
    FIRST_NAME: String,
    LAST_NAME: String,
    PICTURE_URL: String,
    SKILLS_UPDATED: Date,
    PLAYED: Boolean
  },
  {
    id: "ID"
  });
  exports.User = user;
  connection = db.define("Connections", {
    ID: Number,
    PERSON: String,
    CONNECTION: String
  },
  {
    id: "ID"
  });
  exports.Connection = connection;
  connection.hasOne("person", user, {field:"PERSON", reverse:"connections"});
  connection.hasOne("connection", user, {field:"CONNECTION"});
  skills = db.define("Skills", {
    ID: Number,
    PERSON: String,
    SKILL: Number
  },
  {
    id: "ID"
  });
  exports.Skills = skills;
  skills.hasOne("person", user, {field:"PERSON", reverse:"skills"});
  skills.hasOne("skill", skill, {field:"SKILL"});
  comparison = db.define("Comparison", {
    ID: Number,
    LEFT: String,
    RIGHT: String,
    SKILL: Number,
    SCORE: Number,
    USER: String
  },
  {
    id: "ID"
  });
  exports.Comparison = comparison;
  comparison.hasOne("left", user, {field:"LEFT", reverse:"leftComparisons"});
  comparison.hasOne("right", user, {field:"RIGHT", reverse:"rightComparisons"});
  comparison.hasOne("user", user, {field:"USER", reverse:"comparisons"});
}
