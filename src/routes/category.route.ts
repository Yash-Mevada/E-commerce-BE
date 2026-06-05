

import { Router } from "express"
import { categoryController } from "../controllers/CategoryController/category.controller.js"

const router = Router()

router.post("/create", categoryController.createCategory)
router.get("/all", categoryController.getAllCategories)
router.get("/:id", categoryController.getCategoryById)
router.put("/update/:id", categoryController.updateCategory)
router.delete("/delete/:id", categoryController.deleteCategory)

export default router