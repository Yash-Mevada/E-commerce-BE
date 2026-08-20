



import type { Request, Response } from "express"
import { asynWrapper } from "../../utils/asyncWrapper.js"
import Card from "../../model/card.model.js"
import UserClass from "../../model/user.model.js"
import { sendResponse } from "../../utils/responseHandler.js"

export interface CartRequest extends Request {
  cart: any
}

class CartController {

  public createCart = asynWrapper(async (req: any, res: Response) => {
    const user = req?.user
    if (!user?.id) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }

    let userId = user.id

    // Check if the user ID exists in Users table to satisfy cards_user_id_fkey foreign key
    let existingUser = await UserClass.findByPk(userId)
    if (!existingUser) {
      if (user.email) {
        existingUser = await UserClass.findOne({ where: { email: user.email } })
      }
      if (!existingUser) {
        try {
          existingUser = await UserClass.create({
            id: userId,
            first_name: user.first_name || "Customer",
            last_name: user.last_name || "User",
            email: user.email || `${userId}@customer.local`,
            phone_number: user.phone_number || "0000000000",
            password: "customer_placeholder_password",
            cognito_sub: user.cognito_sub || userId,
            role: "user"
          })
        } catch (err: any) {
          console.error("User creation for customer cart failed:", err?.message || err)
          if (user.email) {
            existingUser = await UserClass.findOne({ where: { email: user.email } })
          }
        }
      }
      if (existingUser) {
        userId = existingUser.id
      }
    }

    // Check if the cart already exists for this user to avoid database constraint violations
    const existingCart = await Card.findOne({
      where: { user_id: userId }
    })

    if (existingCart) {
      return sendResponse(res, 200, true, "Cart already exists for this user", existingCart)
    }

    const cart = await Card.create({
      user_id: userId
    })

    return sendResponse(res, 201, true, "Cart created successfully", cart)
  })

  public getCart = asynWrapper(async (req: any, res: Response) => {
    const user = req?.user
    if (!user?.id) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }
    let userId = user.id
    let cart = await Card.findOne({
      where: { user_id: userId }
    })

    if (!cart && user.email) {
      const matchedUser = await UserClass.findOne({ where: { email: user.email } })
      if (matchedUser) {
        cart = await Card.findOne({ where: { user_id: matchedUser.id } })
      }
    }

    return sendResponse(res, 200, true, "Cart fetched successfully", cart)
  })


  public deleteCart = asynWrapper(async (req: any, res: Response) => {
    const user = req?.user
    if (!user?.id) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }
    const { id } = user
    const cart = await Card.findOne({
      where: { user_id: id }
    })
    if (!cart) {
      return sendResponse(res, 404, false, "Cart not found", null)
    }
    await cart.destroy()
    return sendResponse(res, 200, true, "Cart deleted successfully", null)
  })


}

export const cartController = new CartController()


