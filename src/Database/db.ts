
import { Sequelize } from "sequelize-typescript"
import User from "../model/user.model.js"
import Category from "../model/category.model.js"
import Product from "../model/product.model.js"
import Address from "../model/address.model.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { Umzug, SequelizeStorage } from "umzug"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
  models: [User, Category, Product, Address]
})

export const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log("Database connected successfully")

    // Setup Umzug to run migrations programmatically
    const umzug = new Umzug({
      migrations: {
        glob: ['migrations/*.{js,cjs,sql}', { cwd: path.join(__dirname, '../../') }],
        resolve: ({ name, path: filePath }) => {
          return {
            name,
            up: async () => {
              if (!filePath) return
              if (filePath.endsWith('.sql')) {
                const sql = fs.readFileSync(filePath, 'utf8')
                await sequelize.query(sql)
                return
              }
              const migration = await import(filePath)
              const migrationModule = migration.default || migration
              await migrationModule.up(sequelize.getQueryInterface(), sequelize.constructor)
            },
            down: async () => {
              if (!filePath) return
              if (filePath.endsWith('.sql')) {
                return
              }
              const migration = await import(filePath)
              const migrationModule = migration.default || migration
              await migrationModule.down(sequelize.getQueryInterface(), sequelize.constructor)
            }
          }
        }
      },
      storage: new SequelizeStorage({ sequelize }),
      logger: console
    })

    console.log("🚀 Running migrations via Umzug...")
    await umzug.up()
    console.log("✅ All migrations completed successfully!")

  } catch (error) {
    console.error("Error connecting to database or running migrations:", error)
    process.exit(1)
  }
}