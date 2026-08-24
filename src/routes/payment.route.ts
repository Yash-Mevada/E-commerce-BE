import { Router } from "express";
import { paymentController } from "../controllers/PaymentController/payment.controller.js";

const paymentRoutes = Router();

paymentRoutes.post("/verify", paymentController.verifyPayment);

export default paymentRoutes;