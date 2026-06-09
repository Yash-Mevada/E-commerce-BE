import type { Request, Response } from "express"
import { asynWrapper } from "../../utils/asyncWrapper.js"
import { sendResponse } from "../../utils/responseHandler.js"
import Card from "../../model/card.model.js"
import Product from "../../model/product.model.js"
import CartItem from "../../model/cartItem.model.js"

export interface CartItemRequest extends Request {
  cartItem: any
}

class CartItemController {

  public createCartItem = asynWrapper(async (req: any, res: Response) => {
    const { cart_id, product_id, quantity } = req.body

    if (!cart_id || !product_id || !quantity) {
      return sendResponse(res, 400, false, "Cart id, product id and quantity are required", null)
    }

    if (Number(quantity) <= 0) {
      return sendResponse(res, 400, false, "Quantity must be greater than 0", null)
    }

    // 1. Get user's cart
    const user = req?.user
    if (!user?.id) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }

    const cart = await Card.findOne({
      where: { user_id: user.id }
    })

    if (!cart) {
      return sendResponse(res, 404, false, "Cart not found for this user", null)
    }

    // Security check: ensure the provided cart_id belongs to the logged-in user
    if (cart.id !== cart_id) {
      return sendResponse(res, 403, false, "Unauthorized access to this cart", null)
    }

    // 2. Find the product
    const product = await Product.findByPk(product_id)
    if (!product) {
      return sendResponse(res, 404, false, "Product not found", null)
    }

    // Validation: Check if there is enough stock
    if (product.stock < Number(quantity)) {
      return sendResponse(res, 400, false, `Insufficient stock. Only ${product.stock} items left.`, null)
    }

    // 3. Add item to cart (explicitly handling CartItem model to avoid duplicate entries)
    let cartItem = await CartItem.findOne({
      where: { cart_id: cart.id, product_id }
    })

    if (cartItem) {
      // If item already in cart, increment quantity
      cartItem.quantity += Number(quantity)
      await cartItem.save()
    } else {
      // If new, create cart item
      cartItem = await CartItem.create({
        cart_id: cart.id,
        product_id,
        quantity: Number(quantity)
      })
    }

    return sendResponse(res, 201, true, "Cart item created successfully", cartItem)
  })


  public getCartItem = asynWrapper(async (req: any, res: Response) => {
    const { cartItem_id } = req.params
    if (!cartItem_id) {
      return sendResponse(res, 400, false, "Cart item id is required", null)
    }

    // 1. Get user's cart
    const user = req?.user
    if (!user?.id) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }

    const cart = await Card.findOne({
      where: { user_id: user.id }
    })

    if (!cart) {
      return sendResponse(res, 404, false, "Cart not found for this user", null)
    }

    // 2. Find the cart item
    const cartItem = await CartItem.findByPk(cartItem_id)
    if (!cartItem) {
      return sendResponse(res, 404, false, "Cart item not found", null)
    }

    // Security check: ensure the provided cartItem belongs to the logged-in user's cart
    if (cartItem.cart_id !== cart.id) {
      return sendResponse(res, 403, false, "Unauthorized access to this cart item", null)
    }

    return sendResponse(res, 200, true, "Cart item found", cartItem)
  })



  public updateCartItem = asynWrapper(async (req: any, res: Response) => {
    const { cartItem_id } = req.params
    if (!cartItem_id) {
      return sendResponse(res, 400, false, "Cart item id is required", null)
    }

    const { quantity } = req.body
    if (quantity === undefined || quantity === null) {
      return sendResponse(res, 400, false, "Quantity is required", null)
    }

    if (Number(quantity) <= 0) {
      return sendResponse(res, 400, false, "Quantity must be greater than 0", null)
    }

    // 1. Get user's cart
    const user = req?.user
    if (!user?.id) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }

    const cart = await Card.findOne({
      where: { user_id: user.id }
    })

    if (!cart) {
      return sendResponse(res, 404, false, "Cart not found for this user", null)
    }

    // 2. Find the cart item
    const cartItem = await CartItem.findByPk(cartItem_id)
    if (!cartItem) {
      return sendResponse(res, 404, false, "Cart item not found", null)
    }

    // Security check: ensure the provided cartItem belongs to the logged-in user's cart
    if (cartItem.cart_id !== cart.id) {
      return sendResponse(res, 403, false, "Unauthorized access to this cart item", null)
    }

    // 3. Find the product and check stock
    const product = await Product.findByPk(cartItem.product_id)
    if (!product) {
      return sendResponse(res, 404, false, "Product not found", null)
    }

    if (product.stock < Number(quantity)) {
      return sendResponse(res, 400, false, `Insufficient stock. Only ${product.stock} items left.`, null)
    }

    // 4. Update quantity
    cartItem.quantity = Number(quantity)
    await cartItem.save()

    return sendResponse(res, 200, true, "Cart item updated successfully", cartItem)
  })


  public deleteCartItem = asynWrapper(async (req: any, res: Response) => {

    const { cartItem_id } = req.params
    if (!cartItem_id) {
      return sendResponse(res, 400, false, "Cart item id is required", null)
    }

    // 1. Get user's cart
    const user = req?.user
    if (!user?.id) {
      return sendResponse(res, 401, false, "User is not authenticated", null)
    }

    const cart = await Card.findOne({
      where: { user_id: user.id }
    })

    if (!cart) {
      return sendResponse(res, 404, false, "Cart not found for this user", null)
    }

    // 2. Find the cart item
    const cartItem = await CartItem.findByPk(cartItem_id)
    if (!cartItem) {
      return sendResponse(res, 404, false, "Cart item not found", null)
    }

    // Security check: ensure the provided cartItem belongs to the logged-in user's cart
    if (cartItem.cart_id !== cart.id) {
      return sendResponse(res, 403, false, "Unauthorized access to this cart item", null)
    }

    // 3. Delete the cart item
    await cartItem.destroy()

    return sendResponse(res, 200, true, "Cart item deleted successfully", null)

  })

}

export const cartItemController = new CartItemController()