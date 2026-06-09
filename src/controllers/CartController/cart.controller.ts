



import type { Request, Response } from "express"
import { asynWrapper } from "../../utils/asyncWrapper.js"
import Card from "../../model/card.model.js"
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

    const { id } = user

    // Check if the cart already exists for this user to avoid database constraint violations
    const existingCart = await Card.findOne({
      where: { user_id: id }
    })

    if (existingCart) {
      return sendResponse(res, 400, false, "Cart already exists for this user", null)
    }

    const cart = await Card.create({
      user_id: id
    })

    return sendResponse(res, 201, true, "Cart created successfully", cart)
  })

  public getCart = asynWrapper(async (req: any, res: Response) => {
    const user = req?.user
    if (!user?.id) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }
    const { id } = user
    const cart = await Card.findOne({
      where: { user_id: id }
    })
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


