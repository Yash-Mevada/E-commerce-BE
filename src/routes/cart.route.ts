import { Router } from "express"
import { cartController } from "../controllers/CartController/cart.controller.js"



const router = Router()


router.get("/", cartController.getCart)
router.post("/create", cartController.createCart)
router.delete("/delete", cartController.deleteCart)



export default router