import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import type { Optional } from "sequelize";
import User, { type UserCreateAttributes } from "../../model/user.model.js";
import admin from "../../config/firebaseConfig/firebaseAdmin.js";




class AuthController {



  // create user controller
  public async createUserController(
    req: Request,
    res: Response
  ) {


    try {
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

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: this.removedPassword(user)
      })
    } catch (error: unknown) {

      const message = error instanceof Error ? error.message : "Error while creating User"

      return res.status(400).json({
        success: false,
        message: message
      })
    }
  }


  public async loginUserController(req: Request, res: Response) {
    try {
      // debugger
      const { email, password, fcm_token } = req.body


      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        })
      }

      const user = await User.findOne({
        where: {
          email
        }
      })

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found"
        })
      }
      const isPasswordMatched = await this.comparePassword(password, user.password)

      if (!isPasswordMatched) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials"
        })
      }

      const token = await this.generateToken(user)

      if (token) {
        user.refresh_token = token
        await user.save()
      }


      if (fcm_token) {
        user.fcm_token = fcm_token
        await user.save()
      }
      // await this.sendNotificationController(user.fcm_token)

      return res.status(200).cookie("token", token, {
        secure: true,
        httpOnly: true,
        maxAge: 15 * 60 * 60 * 1000,
        sameSite: "strict"
      }).json({
        success: true,
        message: `Welcome back ${user.first_name}`,
        data: this.removedPassword(user)
      })



    } catch (error) {

      const message = error instanceof Error ? error.message : "Error while logging in"

      return res.status(400).json({
        success: false,
        message: message
      })
    }

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


  private async generateToken(user: User) {
    return jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role
    }, process.env.JWT_SECRET!, { expiresIn: "1h" })
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
  private removedPassword(user: any) {
    const userData = user.toJSON()
    delete userData.password
    return userData
  }



  public async isAuthUser(req: any, res: Response, next: any) {
    try {
      const token = req?.cookies?.token || req?.headers?.authorization?.split(" ")[1]

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "User have no token",
        })
      }
      const decordToken: any = jwt.verify(token, process.env.JWT_SECRET!);



      if (!decordToken) {
        return res.status(401).json({
          success: false,
          message: "User is not authenticated",
        })
      }

      const userData = await User.findByPk(decordToken?.id, {
        attributes: ["id", "first_name", "last_name", "email", "phone_number", "role", "created_at", "updated_at"],
      })

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        })
      }


      req.user = userData
      // req.role = decordToken.role
      next()
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Error while checking authentication"
      })
    }
  }

}

export default new AuthController()

