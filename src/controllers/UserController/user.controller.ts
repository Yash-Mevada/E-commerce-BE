import type { Request, Response } from "express";
import User from "../../model/user.model.js";
import { Op } from "sequelize";

class UserController {


  // get all users
  public async getAllUsers(req: Request, res: Response) {
    const { filter, pagination, sort } = req.body
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const offset = (page - 1) * limit;
    let order: any = []
    try {
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
      return res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: rows,
        count
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error while fetching users",
        error: error?.message
      })
    }

  }


  // get profile 
  public async getUserProfile(req: any, res: Response) {
    try {
      const userData = req.user
      return res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: userData
      })

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error while fetching user profile",
        error: error?.message
      })
    }
  }

  public async updateUser(req: any, res: Response) {
    try {

      const { first_name, last_name, email, phone_number, role } = req.body

      const user = await User.findByPk(req.user.id)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        })
      }

      if (first_name !== undefined) user.first_name = first_name
      if (last_name !== undefined) user.last_name = last_name
      if (email !== undefined) user.email = email
      if (phone_number !== undefined) user.phone_number = phone_number
      if (role !== undefined) user.role = role

      await user.save()

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user
      })


    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Error while updating user",
        error: error?.message
      })
    }
  }

}

export default new UserController()