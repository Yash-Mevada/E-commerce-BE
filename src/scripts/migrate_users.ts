import "dotenv/config"
import { connectDB } from "../Database/db.js"
import User from "../model/user.model.js"
import { CognitoServices } from "../services/cognito.services.js"

function sanitizePhoneNumber(phone: string | null): string {
  if (!phone) {
    return "+10000000000"
  }
  let cleaned = phone.replace(/[^\d+]/g, "")
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
      cleaned = "+1" + cleaned
    } else {
      cleaned = "+" + cleaned
    }
  }
  return cleaned
}

async function run() {
  console.log("Starting bulk Cognito user migration...")
  
  try {
    // 1. Connect to database
    await connectDB()
    
    // 2. Fetch all legacy users
    const usersToMigrate = await User.findAll({
      where: {
        cognito_sub: "temp-cognito-sub"
      }
    })
    
    console.log(`Found ${usersToMigrate.length} users to migrate.`)
    
    // 3. Loop and migrate each user
    for (const user of usersToMigrate) {
      try {
        console.log(`Migrating: ${user.email}...`)
        
        // Since we don't have access to their plain-text password, 
        // we create them with a temporary one.
        const tempPassword = "TempPassword@123"
        
        const cognitoUser = await CognitoServices.createUser({
          email: user.email,
          password: tempPassword,
          phone_number: sanitizePhoneNumber(user.phone_number),
          first_name: user.first_name,
          last_name: user.last_name
        })
        
        user.cognito_sub = cognitoUser.cognitoSub
        await user.save()
        
        console.log(`✅ Successfully migrated ${user.email} -> Cognito Sub: ${cognitoUser.cognitoSub}`)
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error)
      }
    }
    
    console.log("Bulk migration completed successfully!")
  } catch (error) {
    console.error("Migration script failed:", error)
  } finally {
    process.exit(0)
  }
}

run()
