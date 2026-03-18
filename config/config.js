import "dotenv/config"

export default {
  "development": {
    // "username": process.env.DB_USERNAME,
    // "password": process.env.DB_PASSWORD,
    // "database": process.env.DB_NAME,
    // "host": process.env.DB_HOST,
    url: process.env.DATABASE_URL,
    "dialect": "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  "test": {
    url: process.env.DATABASE_URL,
    "dialect": "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  "production": {
    url: process.env.DATABASE_URL,
    "dialect": "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
}
