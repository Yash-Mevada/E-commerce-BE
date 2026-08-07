import type { Request, Response } from "express"
import Category from "../../model/category.model.js"
import Product from "../../model/product.model.js"
import User from "../../model/user.model.js"
import { sendResponse } from "../../utils/responseHandler.js"

class DashBoardController {

  public getDashBoardStat = async (req: Request, res: Response) => {
    const { rows: userRows, count: userCount } = await User.findAndCountAll()
    const { rows: productRows, count: productCount } = await Product.findAndCountAll()
    const { rows: categoryRows, count: categoryCount } = await Category.findAndCountAll()

    return sendResponse(res, 200, true, "Dashboard fetched successfully", { userCount, productCount, categoryCount })

  }


}

export const dashBoardController = new DashBoardController()

