
import { Sequelize } from "sequelize-typescript"
import User from "../model/user.model.js"

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false // Required for Supabase
//   }
// })


// console.log(process.env.DATABASE_URL, process.env.PORT)


export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  protocol: "postgres",
  logging: true,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  models: [User]
})

export const connectDB = async () => {
  try {
    const client = await sequelize.authenticate()
    console.log("Database connected successfully")
    // sync models with database
    await sequelize.sync();
    console.log("All models synced successfully");
  } catch (error) {
    console.error("Error connecting to database", error)
    process.exit(1)
  }
}