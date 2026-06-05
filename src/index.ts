import "dotenv/config";
import express from "express";
import userRoutes from "./routes/user.route.js";
import categoryRoutes from "./routes/category.route.js";
import { connectDB } from "./Database/db.js";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middleware/auth.middleware.js";
import productRoutes from "./routes/product.route.js";
import addressRoutes from "./routes/address.route.js";

const app = express()

app.use(cookieParser())

app.use(cors({
  origin: "*"
}))
app.use(bodyParser.json())

connectDB()

app.use(authMiddleware)

app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/addresses", addressRoutes);


app.listen(process.env.PORT, () => {
  console.log("Server is running on port 3000")
})