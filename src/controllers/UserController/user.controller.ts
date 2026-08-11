import type { Request, Response } from "express";
import User from "../../model/user.model.js";
import { Op } from "sequelize";
import { sendResponse } from "../../utils/responseHandler.js";

class UserController {


  // get all users controller
  public async getAllUsers(req: Request, res: Response) {
    const { filter, pagination, sort } = req.body
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const offset = (page - 1) * limit;
    let order: any = []

    let whereConditions = {}
    if (filter && filter?.search && filter?.keyword) {
      whereConditions =
      {
        [Op.or]: filter?.search && filter.search?.map((field: string) => {
          return {
            [field]: {
              [Op.iLike]: `%${filter.keyword}%`
            }
          }
        })
      }
    }
    // SORTING
    if (sort && Object.keys(sort).length > 0) {

      const validColumns = Object.keys(User.getAttributes());

      const [sortKey, sortValue]: any = Object.entries(sort)[0];

      if (
        validColumns.includes(sortKey) &&
        ["ASC", "DESC"].includes(String(sortValue).toUpperCase())
      ) {
        order = [[sortKey, String(sortValue).toUpperCase()]];
      }
    }


    const { count, rows } = await User.findAndCountAll(
      {
        where: whereConditions,
        attributes: ["id", "first_name", "last_name", "email", "phone_number", "role", "created_at", "updated_at"],
        limit: pagination?.limit ? pagination?.limit : undefined,
        offset: pagination?.page ? offset : 0,
        order: order

      }
    )

    return sendResponse(res, 200, true, "Users fetched successfully", rows, null, count)
  }


  // get profile controller
  public async getUserProfile(req: any, res: Response) {
    const userData = req.user

    return sendResponse(res, 200, true, "User profile fetched successfully", userData)
  }


  // updated user controller
  public async updateUser(req: Request, res: Response) {
    const { id } = req.params
    if (!id) {
      return sendResponse(res, 400, false, "User id is required", null)
    }

    const user = await User.findByPk(id as string)
    if (!user) {
      return sendResponse(res, 404, false, "User not found", null)
    }

    const { first_name, last_name, email, phone_number, role } = req.body

    // Validation matching frontend schemas
    if (!first_name || !first_name.trim()) {
      return sendResponse(res, 400, false, "First Name is required", null)
    }
    if (!last_name || !last_name.trim()) {
      return sendResponse(res, 400, false, "Last Name is required", null)
    }
    if (!email || !email.trim()) {
      return sendResponse(res, 400, false, "Email address is required", null)
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return sendResponse(res, 400, false, "Invalid email address", null)
    }
    if (!phone_number || !phone_number.trim()) {
      return sendResponse(res, 400, false, "Phone Number is required", null)
    }
    if (!role || !role.trim()) {
      return sendResponse(res, 400, false, "System role is required", null)
    }
    if (!["user", "admin"].includes(role.trim())) {
      return sendResponse(res, 400, false, "Invalid role", null)
    }

    // Email uniqueness check
    const trimmedEmail = email.trim()
    if (trimmedEmail !== user.email) {
      const existingUser = await User.findOne({ where: { email: trimmedEmail } })
      if (existingUser) {
        return sendResponse(res, 400, false, "User email already exists", null)
      }
    }

    user.first_name = first_name.trim()
    user.last_name = last_name.trim()
    user.email = trimmedEmail
    user.phone_number = phone_number.trim()
    user.role = role.trim()

    await user.save()
    return sendResponse(res, 200, true, "User updated successfully", user)
  }




  public async deleteUser(req: Request, res: Response) {
    const { id } = req.params
    if (!id) {
      return sendResponse(res, 400, false, "User id is required", null)
    }
    const user = await User.findByPk(id as string)
    if (!user) {
      return sendResponse(res, 404, false, "User Not Found", null)
    }
    await user.destroy()
    return sendResponse(res, 200, true, "User deleted successfully", null)
  }

}

export default new UserController()