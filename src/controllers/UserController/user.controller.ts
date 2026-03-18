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
  public async updateUser(req: any, res: Response) {
    const { first_name, last_name, email, phone_number, role } = req.body
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return sendResponse(res, 404, false, "User not found", null)
    }

    if (first_name !== undefined) user.first_name = first_name
    if (last_name !== undefined) user.last_name = last_name
    if (email !== undefined) user.email = email
    if (phone_number !== undefined) user.phone_number = phone_number
    if (role !== undefined) user.role = role

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