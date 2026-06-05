


import { Router } from "express"
import { addressController } from "../controllers/AddressController/address.controller.js"



const router = Router()


router.post("/create", addressController.createAddress)
router.get("/all", addressController.getAllAddresses)
router.get("/:id", addressController.getAddressById)
router.put("/update/:id", addressController.updateAddress)
router.delete("/delete/:id", addressController.deleteAddress)


export default router