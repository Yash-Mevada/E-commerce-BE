import express from "express";
import dotenv from "dotenv"
import { connectDB } from "./Database/db.js";

dotenv.config()

const app = express()


await connectDB()

app.listen(process.env.PORT, () => {
  console.log("Server is running on port 3000")
})