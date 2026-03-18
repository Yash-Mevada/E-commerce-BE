import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User, { type UserCreateAttributes } from "../../model/user.model.js";
import admin from "../../config/firebaseConfig/firebaseAdmin.js";
import { sendForgotPasswordEmail } from "../../utils/sendEmail.js";
import { sendResponse } from "../../utils/responseHandler.js";


export interface UserRequest extends Request {
  user: User | any
}

class AuthController {
  // create user controller
  public async createUserController(
    req: Request,
    res: Response
  ) {

    const { first_name, last_name, email, password, phone_number, role } = req.body
    // debugger
    this.validateUser(first_name, last_name, email)
    await this.checkIfUserExists(email)
    const hasedPassword = await this.hasedPassword(password)
    const user = await this.createUserInDB({
      first_name,
      last_name,
      email,
      password: hasedPassword,
      phone_number,
      role

    })

    return sendResponse(res, 201, true, "User created successfully", this.removedPasswordAndRefeshToken(user))
  }


  public async loginUserController(req: Request, res: Response) {

    // debugger
    const { email, password, fcm_token } = req.body


    if (!email || !password) {
      return sendResponse(res, 400, false, "Email and password are required", null)
    }

    const user = await User.findOne({
      where: {
        email
      }
    })

    if (!user) {
      return sendResponse(res, 401, false, "User not found", null)
    }
    const isPasswordMatched = await this.comparePassword(password, user.password)

    if (!isPasswordMatched) {
      return sendResponse(res, 401, false, "Invalid credentials", null)
    }

    const refresh_token = await this.generateToken(user, "7d")
    const access_token = await this.generateToken(user, "1h")

    if (refresh_token) {
      user.refresh_token = refresh_token
      user.access_token = access_token
      await user.save()
    }


    if (fcm_token) {
      user.fcm_token = fcm_token
      await user.save()
    }
    // await this.sendNotificationController(user.fcm_token)


    return sendResponse(res, 200, true, `Welcome back ${user.first_name}`, this.removedPasswordAndRefeshToken(user), {
      name: "token",
      value: refresh_token,
      options: {
        secure: true,
        httpOnly: true,
        maxAge: 15 * 60 * 60 * 1000,
        sameSite: "strict"
      }
    })
  }



  public async forgotpassword(req: any, res: Response) {

    const { email } = req.body

    if (!email) {
      return sendResponse(res, 400, false, "Email is required", null)
    }

    const isEmailExist = req.user.email === email

    if (!isEmailExist) {
      return sendResponse(res, 404, false, "Email is not exist", null)
    }

    const resetToken = await this.generateToken(req.user, "10m")

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    await sendForgotPasswordEmail(email, resetLink)

    return sendResponse(res, 200, true, "Reset password link sent successfully", null)
  }


  public async resetPassword(req: any, res: Response) {

    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      return sendResponse(res, 400, false, "Token and new password are required", null)
    }
    const decoded: any = await jwt.verify(token, process.env.JWT_SECRET!)

    const user: any = await User.findByPk(decoded.id)

    console.log("users", user)
    if (!user) {
      return sendResponse(res, 404, false, "User not found", null)
    }
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    return sendResponse(res, 200, true, "Password updated successfully", null)
  }

  public async sendNotificationController(fcm_token: string) {
    if (!fcm_token) {
      throw new Error("FCM token is required")
    }

    try {
      await admin.messaging().send({
        token: fcm_token,
        notification: {
          title: "Login Successful 🎉",
          body: "You have successfully logged in our application",
        }
      })
    } catch (error) {
      console.log("Error while sending notification", error)
    }

  }


  private async comparePassword(password: string, hasedPassword: string) {
    return await bcrypt.compare(password, hasedPassword)
  }


  private async generateToken(user: User, time: any = "1h") {
    return jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role
    }, process.env.JWT_SECRET!, { expiresIn: time })
  }

  // validate user
  private validateUser(first_name: string, last_name: string, email: string) {
    if (!first_name || !last_name || !email) {
      throw new Error("First name, last name and email are required")
    }
  }


  // check if user is exist or not
  private async checkIfUserExists(email: string) {
    const extistUser = await User.findOne({
      where: {
        email
      }
    })

    if (extistUser) {
      throw new Error("User already exists with this email")
    }
  }



  // hased password
  private async hasedPassword(passowrd: string) {
    return await bcrypt.hash(passowrd, 10)
  }


  // create user in database
  private async createUserInDB(user: UserCreateAttributes) {
    return await User.create(user)
  }

  // removed password key from user response
  private removedPasswordAndRefeshToken(user: any) {
    const userData = user.toJSON()
    delete userData.password
    delete userData.refresh_token
    return userData
  }

  public async isAuthUser(req: any, res: Response, next: any) {

    const token = req?.cookies?.token || req?.headers?.authorization?.split(" ")[1]

    if (!token) {
      return sendResponse(res, 400, false, "User have no token", null)
    }
    const decordToken: any = jwt.verify(token, process.env.JWT_SECRET!);



    if (!decordToken) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }

    const userData = await User.findByPk(decordToken?.id, {
      attributes: ["id", "first_name", "last_name", "email", "phone_number", "role", "created_at", "updated_at"],
    })

    if (!userData) {
      return sendResponse(res, 404, false, "User not found", null)
    }


    req.user = userData
    // req.role = decordToken.role
    next()

  }

}

export default new AuthController()

