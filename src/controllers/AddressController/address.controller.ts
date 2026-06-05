import type { Request, Response } from "express"
import Address from "../../model/address.model.js"
import { sendResponse } from "../../utils/responseHandler.js"
import User from "../../model/user.model.js"
import { asynWrapper } from "../../utils/asyncWrapper.js"




interface addressRequest extends Request {
  address: Address | any
}

class AddressController {


  public createAddress = asynWrapper(async (req: Request, res: Response) => {

    const { user_id, full_name, address, city, state, pincode, phone_number, country } = req.body
    if (!user_id || !full_name || !address || !city || !state || !pincode || !phone_number || !country) {
      return sendResponse(res, 400, false, "User id, full name, address, city, state, pincode, phone number, country are required", null)
    }

    const addressData = await Address.create({
      user_id,
      full_name,
      address,
      city,
      state,
      pincode,
      phone_number,
      country
    })
    return sendResponse(res, 201, true, "Address created successfully", addressData)
  })


  public getAllAddresses = asynWrapper(async (req: Request, res: Response) => {

    const addresses = await Address.findAll({
      attributes: ["id", "user_id", "full_name", "address", "city", "state", "pincode", "phone_number", "country", "created_at", "updated_at"],
      include: [
        {
          model: User
        }
      ]
    })
    return sendResponse(res, 200, true, "All addresses fetched successfully", addresses)
  })




  public getAddressById = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string
    if (!id) {
      return sendResponse(res, 400, false, "Address id is required", null)
    }
    const address = await Address.findByPk(id, {
      attributes: ["id", "user_id", "full_name", "address", "city", "state", "pincode", "phone_number", "country", "created_at", "updated_at"],
      include: [
        {
          model: User
        }
      ]
    })
    return sendResponse(res, 200, true, "Address fetched successfully", address)
  })


  public updateAddress = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string
    if (!id) {
      return sendResponse(res, 400, false, "Address id is required", null)
    }
    const { user_id, full_name, address, city, state, pincode, phone_number, country } = req.body
    if (!user_id || !full_name || !address || !city || !state || !pincode || !phone_number || !country) {
      return sendResponse(res, 400, false, "User id, full name, address, city, state, pincode, phone number, country are required", null)
    }

    const updateData: {
      user_id?: string,
      full_name?: string,
      address?: string,
      city?: string,
      state?: string,
      pincode?: string,
      phone_number?: string,
      country?: string
    } = {}
    if (user_id) updateData.user_id = user_id as string
    if (full_name) updateData.full_name = full_name as string
    if (address) updateData.address = address as string
    if (city) updateData.city = city as string
    if (state) updateData.state = state as string
    if (pincode) updateData.pincode = pincode as string
    if (phone_number) updateData.phone_number = phone_number as string
    if (country) updateData.country = country as string

    const addressData = await Address.findByPk(id)
    if (!addressData) {
      return sendResponse(res, 404, false, "Address not found", null)
    }
    await addressData.update(updateData)
    return sendResponse(res, 200, true, "Address updated successfully", addressData)
  })


  public deleteAddress = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string
    if (!id) {
      return sendResponse(res, 400, false, "Address id is required", null)
    }
    const address = await Address.findByPk(id)
    if (!address) {
      return sendResponse(res, 404, false, "Address not found", null)
    }
    await address.destroy()
    return sendResponse(res, 200, true, "Address deleted successfully", null)
  })

}


export const addressController = new AddressController()