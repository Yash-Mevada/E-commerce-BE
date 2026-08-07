import { Router } from "express";
import { customerController } from "../controllers/CustomerController/customer.controller.js";

const router = Router();

router.post("/all", customerController.getAllCustomers);
router.post("/register", customerController.registerCustomer);
router.post("/login", customerController.loginCustomer);
router.get("/:id", customerController.getCustomerById);
router.post("/create", customerController.createCustomer);
router.put("/update/:id", customerController.updateCustomer);
router.delete("/delete/:id", customerController.deleteCustomer);

export default router;
