import { Router } from "express";
import { orderController } from "../controllers/OrderController/order.controller.js";

const router = Router();

router.post("/create", orderController.createOrder);

export default router;
