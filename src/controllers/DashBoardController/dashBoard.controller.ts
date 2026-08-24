import type { Request, Response } from "express"
import Category from "../../model/category.model.js"
import Product from "../../model/product.model.js"
import User from "../../model/user.model.js"
import order from "../../model/order.model.js"
import { sendResponse } from "../../utils/responseHandler.js"

class DashBoardController {

  public getDashBoardStat = async (req: Request, res: Response) => {
    const userCount = await User.count()
    const productCount = await Product.count()
    const categoryCount = await Category.count()
    const orderCount = await order.count()
    const pendingOrderCount = await order.count({ where: { status: "PENDING" } })
    const deliveredOrderCount = await order.count({ where: { status: "DELIVERED" } })
    const totalRevenue = (await order.sum("total", { where: { paymentStatus: "PAID" } })) || 0

    const recentOrders = await order.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name", "email"]
        }
      ]
    })

    return sendResponse(res, 200, true, "Dashboard fetched successfully", {
      userCount,
      productCount,
      categoryCount,
      orderCount,
      pendingOrderCount,
      deliveredOrderCount,
      totalRevenue,
      recentOrders
    })

  }


}

export const dashBoardController = new DashBoardController()

