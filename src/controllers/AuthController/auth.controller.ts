import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User, { type UserCreateAttributes } from "../../model/user.model.js";
import admin from "../../config/firebaseConfig/firebaseAdmin.js";
import { sendForgotPasswordEmail } from "../../utils/sendEmail.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { CognitoServices } from "../../services/cognito.services.js";


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


    const cognitoUser = await CognitoServices.createUser({
      email, password, phone_number, first_name, last_name
    })

    try {
      const user = await this.createUserInDB({
        cognito_sub: cognitoUser.cognitoSub,
        first_name,
        last_name,
        email,
        password: hasedPassword,
        phone_number,
        role
      })

      return sendResponse(res, 201, true, "User created successfully", this.removedPasswordAndRefeshToken(user))
    } catch (error) {
      try {
        await CognitoServices.deleteUser(email)
      } catch (rollbackError) {
        console.error("Failed to delete Cognito user during rollback:", rollbackError)
      }
      throw error
    }
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
    // 1. If legacy user, authenticate locally first, then JIT migrate them to Cognito
    if (!user.cognito_sub || user.cognito_sub === "temp-cognito-sub") {
      const isPasswordMatched = await this.comparePassword(password, user.password)
      if (!isPasswordMatched) {
        return sendResponse(res, 401, false, "Invalid credentials", null)
      }

      try {
        console.log(`JIT migrating user ${email} to Cognito...`)
        const cognitoUser = await CognitoServices.createUser({
          email,
          password, // use the plain text password they just entered!
          phone_number: user.phone_number || "+10000000000",
          first_name: user.first_name,
          last_name: user.last_name
        })
        user.cognito_sub = cognitoUser.cognitoSub
        await user.save()
        console.log(`✅ JIT migrated user ${email} successfully. Sub: ${cognitoUser.cognitoSub}`)
      } catch (migrationError) {
        console.error(`Failed JIT migration for user ${email}:`, migrationError)
        return sendResponse(res, 500, false, "Failed to sync account credentials with auth service", null)
      }
    }

    // 2. Authenticate the user directly via Cognito (handles validation for all users)
    let refresh_token: string | undefined
    let access_token: string | undefined
    let id_token: string | undefined
    let expires_in: number | undefined

    try {
      console.log(`Authenticating user ${email} via Cognito...`)
      const authResult = await CognitoServices.loginUser({ email, password })
      if (!authResult) {
        return sendResponse(res, 401, false, "Invalid credentials", null)
      }

      refresh_token = authResult.RefreshToken
      access_token = authResult.AccessToken
      id_token = authResult.IdToken
      expires_in = authResult.ExpiresIn
    } catch (cognitoError: any) {
      console.error("Cognito login error:", cognitoError)
      if (cognitoError.name === "NotAuthorizedException" || cognitoError.name === "UserNotFoundException") {
        return sendResponse(res, 401, false, "Invalid credentials", null)
      }
      return sendResponse(res, 500, false, "Authentication failed", null)
    }

    // 3. Update database tokens and FCM token as needed
    if (refresh_token) {
      user.refresh_token = refresh_token
      user.access_token = access_token || ""
      await user.save()
    }

    if (fcm_token) {
      user.fcm_token = fcm_token
      await user.save()
    }

    return sendResponse(res, 200, true, `Welcome back ${user.first_name}`, {
      ...this.removedPasswordAndRefeshToken(user),
      access_token,
      id_token
    }, {
      name: "token",
      value: refresh_token || "",
      options: {
        secure: true,
        httpOnly: true,
        maxAge: (expires_in || 3600) * 1000,
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

}

export default new AuthController()

