const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./users');
const Device = require('./device');
const Token = require('./token');
const Party = require('./party');

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.User = User;
db.Device = Device;
db.Token = Token;
db.Party = Party;

User.init(sequelize);
Device.init(sequelize);
Token.init(sequelize);
Party.init(sequelize);

User.associate(db);
Device.associate(db);
Token.associate(db);
Party.associate(db);

module.exports = db;