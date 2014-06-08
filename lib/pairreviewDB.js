var orm = require("orm");

exports.connect = function (fs, after) {
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
    LAST_UPDATED: Number,
    PICTURE_URL: String,
    PLAYED: Boolean
  },
  {
    id: "ID"
  });
  exports.User = user;
  comparison = db.define("Comparison", {
    LEFT: String,
    RIGHT: String,
    SKILL: Number,
    SCORE: Number,
    USER: String
  },
  {
  });
  exports.Comparison = comparison;
  comparison.hasOne("left", user, {field:"LEFT", reverse:"leftComparisons"});
  comparison.hasOne("right", user, {field:"RIGHT", reverse:"rightComparisons"});
  comparison.hasOne("user", user, {field:"USER", reverse:"comparisons"});
}
