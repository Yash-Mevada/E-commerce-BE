
import { Router } from "express"
import { productController } from "../controllers/ProductController/product.controller.js"
import multer from "multer"

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

router.post("/create", productController.createProductController)
router.post("/all", productController.getAllProducts)
router.post("/upload", upload.single("image"), productController.uploadProductImage)
router.get("/:id", productController.getProductById)
router.put("/update/:id", productController.updateProduct)
router.delete("/delete/:id", productController.deleteProduct)

export default router