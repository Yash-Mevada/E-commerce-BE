import jwt from "jsonwebtoken"
import Users from "../model/user.model.js"



export const authMiddleware = async (req: any, res: any, next: any) => {
  // Bypass auth for public routes (registration & login)
  const publicPaths = ["/api/users/create", "/api/users/login"]
  if (publicPaths.includes(req.path)) {
    return next()
  }

  const token = req?.cookies?.token || req?.headers?.authorization?.split(" ")[1]

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "User have no token"
    })
  }
  const decordToken: any = jwt.verify(token, process.env.JWT_SECRET!);

  if (!decordToken) {
    return res.status(401).json({
      success: false,
      message: "User is not authenticated"
    })
  }

  const userData = await Users.findByPk(decordToken?.id, {
    attributes: ["id", "first_name", "last_name", "email", "phone_number", "role", "created_at", "updated_at"],
  })

  if (!userData) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    })
  }

  req.user = userData
  next()

} 