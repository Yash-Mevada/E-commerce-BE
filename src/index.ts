import "dotenv/config";
import express from "express";
import userRoutes from "./routes/user.route.js";
import { connectDB } from "./Database/db.js";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cookieParser())

app.use(cors({
  origin: "*"
}))
app.use(bodyParser.json())

connectDB()

app.use("/api/users", userRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server is running on port 3000")
})