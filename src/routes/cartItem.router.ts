import { Router } from "express"
import { cartItemController } from "../controllers/CartItemsController/cartItem.controller.js"


const router = Router()

router.post("/create", cartItemController.createCartItem)
router.get("/:cartItem_id", cartItemController.getCartItem)
router.put("/update/:cartItem_id", cartItemController.updateCartItem)
router.delete("/delete/:cartItem_id", cartItemController.deleteCartItem)

export default router