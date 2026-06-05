
import { Router } from "express"
import { productController } from "../controllers/ProductController/product.controller.js"

const router = Router()

router.post("/create", productController.createProductController)
router.get("/all", productController.getAllProducts)
router.get("/:id", productController.getProductById)
router.put("/update/:id", productController.updateProduct)
router.delete("/delete/:id", productController.deleteProduct)

export default router