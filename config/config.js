require('dotenv').config();

module.exports = {
    "development": {
      "username": "stressy",
      "password": process.env.SEQUELIZE_PASSWORD,
      "database": "database_stressy",
      "host": "127.0.0.1",
      "dialect": "mysql"
      
    },
    "test": {
      "username": "root",
      "password": process.env.SEQUELIZE_PASSWORD,
      "database": "database_test",
      "host": "127.0.0.1",
      "dialect": "mysql"
    },
    "production": {
      "username": "root",
      "password": process.env.SEQUELIZE_PASSWORD,
      "database": "database_production",
      "host": "127.0.0.1",
      "dialect": "mysql"
    }
  };
  