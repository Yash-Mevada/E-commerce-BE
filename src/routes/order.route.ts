import { Router } from "express";
import { orderController } from "../controllers/OrderController/order.controller.js";

const router = Router();

router.post("/create", orderController.createOrder);
router.post("/all", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.put("/status/:id", orderController.updateOrderStatus);
router.delete("/delete/:id", orderController.deleteOrder);

export default router;
